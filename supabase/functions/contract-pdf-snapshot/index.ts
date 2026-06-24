// Contract PDF Snapshot — generates a PDF of the rendered contract on activation,
// variation acceptance, or completion, and uploads it to the private `contracts` bucket.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RequestBody {
  contract_id: string;
  trigger_event?: string;
  variation_id?: string | null;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function buildPdf(args: {
  contract: any;
  variations: any[];
  events: any[];
}): Uint8Array {
  const { contract, variations, events } = args;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureRoom = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 16) => {
    ensureRoom(size + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.text(text, margin, y);
    y += size + 8;
    doc.setFont("helvetica", "normal");
  };

  const para = (text: string, size = 10) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || "", usableWidth);
    for (const line of lines) {
      ensureRoom(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
  };

  const spacer = (h = 8) => {
    y += h;
  };

  // Cover
  heading("Construction Works Contract", 20);
  para(`Reference: ${contract.reference ?? contract.id}`);
  para(`Status: ${contract.status}`);
  para(`Template version: ${contract.template_version ?? "—"}`);
  para(`Generated: ${new Date().toISOString()}`);
  spacer(12);

  // Parties
  heading("Parties", 14);
  const ho = contract.homeowner_snapshot ?? {};
  const tr = contract.trade_snapshot ?? {};
  para(`Homeowner: ${ho.name ?? ""} (${ho.email ?? ""})`);
  para(
    `Trade: ${tr.company_name ?? tr.name ?? ""} — ${tr.trade_type ?? ""}`,
  );
  const addr = contract.property_address ?? {};
  para(`Property: ${addr.address ?? ""}, ${addr.postcode ?? ""}`);
  spacer(8);

  // Commercial summary
  heading("Commercial Summary", 14);
  para(
    `Total (incl. VAT): £${((contract.total_value_incl_vat_pence ?? 0) / 100).toFixed(2)}`,
  );
  para(
    `Total (excl. VAT): £${((contract.total_value_excl_vat_pence ?? 0) / 100).toFixed(2)}`,
  );
  spacer(4);
  para("Payment milestones:");
  for (const m of contract.payment_milestones ?? []) {
    para(
      `  ${m.sequence}. ${m.description} — £${((m.amount_pence ?? 0) / 100).toFixed(2)}`,
    );
  }
  spacer(8);

  // Rendered legal text
  heading("Contract Terms", 14);
  para(contract.rendered_legal_text ?? "(no rendered text on record)");
  spacer(8);

  // Bespoke terms
  if (contract.homeowner_bespoke_terms || contract.trade_bespoke_terms) {
    heading("Bespoke Terms", 14);
    if (contract.homeowner_bespoke_terms) {
      para("Homeowner additions:");
      para(contract.homeowner_bespoke_terms);
    }
    if (contract.trade_bespoke_terms) {
      para("Trade additions:");
      para(contract.trade_bespoke_terms);
    }
    spacer(8);
  }

  // Variations
  if (variations.length > 0) {
    heading("Variations", 14);
    for (const v of variations) {
      para(
        `#${v.sequence} — ${v.title} [${v.status}] proposed by ${v.proposed_by}`,
      );
      if (v.description) para(`  ${v.description}`);
      if (v.cost_change_pence) {
        para(`  Cost change: £${(v.cost_change_pence / 100).toFixed(2)}`);
      }
      if (v.programme_impact_days) {
        para(`  Programme impact: ${v.programme_impact_days} days`);
      }
      spacer(4);
    }
  }

  // Signatures
  heading("Signatures", 14);
  para(
    `Homeowner signed: ${contract.homeowner_signed_at ?? "—"}  hash: ${contract.homeowner_signature_hash ?? "—"}`,
  );
  para(
    `Trade signed: ${contract.trade_signed_at ?? "—"}  hash: ${contract.trade_signature_hash ?? "—"}`,
  );
  para(`Document hash: ${contract.full_text_hash ?? "—"}`);
  spacer(8);

  // Activity log
  heading("Activity Log", 14);
  for (const e of events) {
    para(`${e.created_at}  ${e.event_type}  (${e.actor_role ?? "system"})`);
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Authenticate the caller and confirm they are a party to the contract or an admin.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userErr || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.contract_id) {
      return new Response(JSON.stringify({ error: "contract_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: isParty }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("user_is_contract_party", {
        _user_id: userId,
        _contract_id: body.contract_id,
      }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    if (!isParty && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const { data: contract, error: cErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", body.contract_id)
      .maybeSingle();
    if (cErr || !contract) {
      return new Response(JSON.stringify({ error: cErr?.message ?? "not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: variations }, { data: events }] = await Promise.all([
      supabase
        .from("contract_variations")
        .select("*")
        .eq("contract_id", body.contract_id)
        .order("sequence", { ascending: true }),
      supabase
        .from("contract_events")
        .select("created_at,event_type,actor_role")
        .eq("contract_id", body.contract_id)
        .order("created_at", { ascending: true }),
    ]);

    const pdfBytes = new Uint8Array(
      buildPdf({
        contract,
        variations: variations ?? [],
        events: events ?? [],
      }) as ArrayBuffer,
    );

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const suffix = body.trigger_event ?? "snapshot";
    const path = `${body.contract_id}/${ts}_${suffix}.pdf`;

    const { error: upErr } = await supabase.storage
      .from("contracts")
      .upload(path, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfHash = await sha256Hex(
      Array.from(pdfBytes).map((b) => String.fromCharCode(b)).join(""),
    );

    await supabase
      .from("contracts")
      .update({
        latest_pdf_path: path,
        latest_pdf_generated_at: new Date().toISOString(),
        latest_pdf_hash: pdfHash,
      })
      .eq("id", body.contract_id);

    await supabase.from("contract_events").insert({
      contract_id: body.contract_id,
      event_type: "pdf_generated",
      payload: {
        path,
        pdf_hash: pdfHash,
        trigger_event: body.trigger_event ?? null,
        variation_id: body.variation_id ?? null,
      },
    });

    return new Response(
      JSON.stringify({ ok: true, path, pdf_hash: pdfHash }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
