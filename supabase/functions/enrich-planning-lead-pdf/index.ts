// Enriches a single planning_leads row by:
//  1. Scraping the council application page with Firecrawl to find the application form PDF link.
//  2. Scraping that PDF with Firecrawl (markdown).
//  3. Asking Lovable AI (Gemini 2.5 Flash) to extract structured applicant + agent + proposal data.
//  4. Updating the row.
//
// Admin only. POST { lead_id: string }.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ScrapeResp {
  success?: boolean;
  data?: {
    markdown?: string;
    links?: string[];
    metadata?: { sourceURL?: string };
  };
  error?: string;
}

async function firecrawlScrape(url: string, formats: string[]): Promise<ScrapeResp> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  const res = await fetch(`${FIRECRAWL}/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats, onlyMainContent: false }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// Council portals often serve PDFs from viewer/download endpoints with no .pdf extension.
function looksLikeDocLink(href: string): boolean {
  const h = href.toLowerCase();
  if (/\.pdf(\?|#|$)/.test(h)) return true;
  return /(docid=|documentid=|showdoc|viewdoc|getfile|filedownload|downloaddocument|\/files\/|\/documents?\/|mediaid=|attachment)/.test(h);
}

// Score a link to find the most likely "application form" PDF.
function scoreFormLink(href: string, label = ""): number {
  if (!looksLikeDocLink(href)) return 0;
  const h = href.toLowerCase();
  const l = label.toLowerCase();
  let s = /\.pdf(\?|#|$)/.test(h) ? 2 : 1;
  const combined = `${h} ${l}`;
  if (/application[\s_-]*form/.test(combined)) s += 50;
  if (/\b1app\b/.test(combined)) s += 40;
  if (/planning[\s_-]*application/.test(combined)) s += 20;
  if (/householder/.test(combined)) s += 15;
  if (/form/.test(combined)) s += 5;
  if (/(plan|drawing|elevation|location|block|site)/.test(combined)) s -= 30;
  if (/(consultation|comment|response|decision|notice)/.test(combined)) s -= 30;
  return s;
}

// Extract candidate document links from markdown (handles `[label](url)` patterns).
function extractPdfLinks(markdown: string, fallbackLinks: string[]): Array<{ href: string; label: string }> {
  const out: Array<{ href: string; label: string }> = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)[^)]*\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    if (looksLikeDocLink(m[2])) out.push({ label: m[1], href: m[2] });
  }
  for (const href of fallbackLinks ?? []) {
    if (looksLikeDocLink(href) && !out.some((x) => x.href === href)) {
      out.push({ href, label: "" });
    }
  }
  return out;
}


interface Extracted {
  applicant_name: string | null;
  applicant_address: string | null;
  applicant_contact: string | null;
  agent_name: string | null;
  agent_company: string | null;
  agent_address: string | null;
  agent_contact: string | null;
  proposal_type: string | null;
}

async function extractWithAI(pdfMarkdown: string): Promise<Extracted> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const truncated = pdfMarkdown.slice(0, 30000);

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract structured data from UK planning application form PDFs (form 1APP / householder application). " +
            "Return ONLY JSON matching the supplied schema. Use null where the value is not present. " +
            "Concatenate multi-line addresses with commas. For contact, combine phone and email if both are present (phone | email). " +
            "agent_name is the individual person; agent_company is their architecture/planning firm if shown separately.",
        },
        { role: "user", content: `PDF contents:\n\n${truncated}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_application",
            description: "Extract applicant, agent and proposal type from a UK planning application form",
            parameters: {
              type: "object",
              properties: {
                applicant_name: { type: ["string", "null"] },
                applicant_address: { type: ["string", "null"] },
                applicant_contact: { type: ["string", "null"], description: "Phone and/or email" },
                agent_name: { type: ["string", "null"], description: "Representative / agent full name (person)" },
                agent_company: { type: ["string", "null"], description: "Agent's firm or practice name, e.g. 'Smith Architects Ltd'" },
                agent_address: { type: ["string", "null"] },
                agent_contact: { type: ["string", "null"], description: "Phone and/or email" },
                proposal_type: {
                  type: ["string", "null"],
                  description: "Short tag e.g. 'Single storey rear extension', 'Two storey side extension', 'Loft conversion', 'New dwelling'",
                },
              },
              required: [
                "applicant_name",
                "applicant_address",
                "applicant_contact",
                "agent_name",
                "agent_company",
                "agent_address",
                "agent_contact",
                "proposal_type",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_application" } },
    }),
  });

  if (res.status === 429) throw new Error("AI rate-limited (429). Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted (402). Top up at Settings > Workspace > Usage.");
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);

  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  const args = call?.function?.arguments;
  if (!args) throw new Error("AI returned no tool_call arguments");
  return JSON.parse(args) as Extracted;
}

function splitContact(raw: string | null): { email: string | null; phone: string | null } {
  if (!raw) return { email: null, phone: null };
  const emailMatch = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const email = emailMatch ? emailMatch[0] : null;
  const remainder = email ? raw.replace(email, "") : raw;
  const phoneMatch = remainder.match(/[+()\d][\d\s()+-]{7,}\d/);
  const phone = phoneMatch ? phoneMatch[0].trim() : null;
  return { email, phone };
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const leadId = body?.lead_id;
    if (!leadId || typeof leadId !== "string") {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: lead, error: leadErr } = await supabase
      .from("planning_leads")
      .select("id, council_application_url, application_ref, council_name")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!lead.council_application_url) {
      return new Response(JSON.stringify({ error: "No council application URL on file for this lead" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: scrape council page to find PDF (with documents sub-page fallback)
    console.log(`[ENRICH] ${lead.application_ref}: scraping ${lead.council_application_url}`);
    const page = await firecrawlScrape(lead.council_application_url, ["markdown", "links"]);
    const pageMd = page.data?.markdown ?? "";
    const pageLinks = page.data?.links ?? [];
    let candidates = extractPdfLinks(pageMd, pageLinks);

    // Fallback: many council portals hide PDFs behind a Documents/Associated docs sub-page.
    if (!candidates.some((c) => scoreFormLink(c.href, c.label) > 0)) {
      const docHints = /(document|associated|supporting|files|attachments|drawing)/i;
      const subPages = new Set<string>();
      // From markdown [label](href) pairs
      const mdLinkRe = /\[([^\]]+)\]\(([^)]+)\)/gi;
      let m: RegExpExecArray | null;
      while ((m = mdLinkRe.exec(pageMd)) !== null) {
        const label = m[1];
        const href = m[2];
        if (/\.pdf/i.test(href)) continue;
        if (docHints.test(label) || docHints.test(href)) subPages.add(href);
      }
      // From raw link list
      for (const href of pageLinks) {
        if (/\.pdf/i.test(href)) continue;
        if (docHints.test(href)) subPages.add(href);
      }

      const tried: string[] = [];
      for (const sub of Array.from(subPages).slice(0, 3)) {
        const subUrl = new URL(sub, lead.council_application_url).toString();
        tried.push(subUrl);
        console.log(`[ENRICH] ${lead.application_ref}: fallback scraping ${subUrl}`);
        try {
          const subPage = await firecrawlScrape(subUrl, ["markdown", "links"]);
          const more = extractPdfLinks(subPage.data?.markdown ?? "", subPage.data?.links ?? []);
          candidates = candidates.concat(more);
          if (more.some((c) => scoreFormLink(c.href, c.label) > 0)) break;
        } catch (e) {
          console.error(`[ENRICH] sub-page scrape failed: ${(e as Error).message}`);
        }
      }
      if (tried.length) console.log(`[ENRICH] ${lead.application_ref}: tried ${tried.length} sub-pages`);
    }

    candidates.sort((a, b) => scoreFormLink(b.href, b.label) - scoreFormLink(a.href, a.label));
    const best = candidates.find((c) => scoreFormLink(c.href, c.label) > 0);
    if (!best) {
      return new Response(
        JSON.stringify({ error: "No application-form PDF link found on council page", candidates_found: candidates.length }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const pdfUrl = new URL(best.href, lead.council_application_url).toString();
    console.log(`[ENRICH] ${lead.application_ref}: found PDF ${pdfUrl}`);

    // Step 2: scrape the PDF
    const pdfScrape = await firecrawlScrape(pdfUrl, ["markdown"]);
    const md = pdfScrape.data?.markdown ?? "";
    if (md.length < 200) {
      return new Response(
        JSON.stringify({ error: "PDF returned too little text to extract", pdf_url: pdfUrl, chars: md.length }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 3: AI extraction
    const extracted = await extractWithAI(md);

    // Step 4: Auto-link or create agent record so the Agents tab populates.
    let agentId: string | null = null;
    if (extracted.agent_name && extracted.agent_name.trim()) {
      const contactName = extracted.agent_name.trim();
      const companyName = (extracted.agent_company ?? "").trim() || null;
      const { email, phone } = splitContact(extracted.agent_contact);

      // Find existing (case-insensitive) on (contact_name, company_name)
      const { data: existing } = await supabase
        .from("planning_agents")
        .select("id, councils_active, email, phone, address")
        .ilike("contact_name", contactName)
        .maybeSingle();

      if (existing) {
        agentId = existing.id;
        const councils: string[] = existing.councils_active ?? [];
        const nextCouncils = councils.includes(lead.council_name)
          ? councils
          : [...councils, lead.council_name];
        await supabase
          .from("planning_agents")
          .update({
            councils_active: nextCouncils,
            email: existing.email ?? email ?? undefined,
            phone: existing.phone ?? phone ?? undefined,
            address: existing.address ?? extracted.agent_address ?? undefined,
            company_name: companyName ?? undefined,
          })
          .eq("id", existing.id);
      } else {
        const { data: created, error: insertErr } = await supabase
          .from("planning_agents")
          .insert({
            contact_name: contactName,
            company_name: companyName,
            email,
            phone,
            address: extracted.agent_address,
            councils_active: [lead.council_name],
            relationship_status: "identified",
          })
          .select("id")
          .single();
        if (insertErr) {
          console.error("[ENRICH] agent insert failed:", insertErr.message);
        } else {
          agentId = created?.id ?? null;
        }
      }
    }

    // Step 5: update lead (including agent_id link)
    const { error: updErr } = await supabase
      .from("planning_leads")
      .update({
        applicant_name: extracted.applicant_name ?? undefined,
        applicant_address: extracted.applicant_address ?? undefined,
        applicant_contact: extracted.applicant_contact ?? undefined,
        agent_name: extracted.agent_name ?? undefined,
        agent_address: extracted.agent_address ?? undefined,
        agent_contact: extracted.agent_contact ?? undefined,
        agent_id: agentId ?? undefined,
        proposal_type: extracted.proposal_type ?? undefined,
        pdf_source_url: pdfUrl,
        pdf_enriched_at: new Date().toISOString(),
        form1app_extracted: true,
      })
      .eq("id", leadId);
    if (updErr) throw new Error(`Update failed: ${updErr.message}`);

    return new Response(
      JSON.stringify({ ok: true, pdf_url: pdfUrl, extracted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[ENRICH-PDF] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
