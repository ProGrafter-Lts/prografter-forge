// Admin-only: record a quote + contract that were agreed directly with the
// homeowner, outside the platform's standard quote-submission flow.
// Deliberately does NOT fire the "quote-received" new-quote notification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "webp"];

function decodeBase64(data: string): Uint8Array {
  const clean = data.includes(",") ? data.split(",")[1] : data;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(url, service);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json();
    const {
      jobId,
      tradeId,
      amount,
      agreedAt,
      notes,
      quoteFile,
      contractFile,
      notifyHomeowner,
    } = body ?? {};

    if (!UUID_RE.test(jobId ?? "") || !UUID_RE.test(tradeId ?? "")) {
      return json({ error: "A valid job and trade are required" }, 400);
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return json({ error: "A valid agreed value is required" }, 400);
    }
    if (!quoteFile?.data || !quoteFile?.name) {
      return json({ error: "The agreed quote document is required" }, 400);
    }

    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, ref, title, job_type, address, postcode, homeowner_id")
      .eq("id", jobId)
      .maybeSingle();
    if (jobErr || !job) return json({ error: "Job not found" }, 404);

    const uploadOne = async (file: { name: string; data: string }, kind: string) => {
      const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        throw new Error(`Unsupported file type: .${ext}`);
      }
      const bytes = decodeBase64(file.data);
      if (bytes.byteLength > 15 * 1024 * 1024) throw new Error("File exceeds 15MB");
      const path = `${tradeId}/agreed/${jobId}-${kind}-${Date.now()}.${ext}`;
      const { error } = await admin.storage.from("quote-pdfs").upload(path, bytes, {
        contentType: ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });
      if (error) throw new Error(`Upload failed (${kind}): ${error.message}`);
      return path;
    };

    const quotePath = await uploadOne(quoteFile, "quote");
    const contractPath = contractFile?.data && contractFile?.name
      ? await uploadOne(contractFile, "contract")
      : null;

    const agreedIso = agreedAt ? new Date(agreedAt).toISOString() : new Date().toISOString();

    const { data: quoteRow, error: insErr } = await admin
      .from("quotes")
      .insert({
        job_id: jobId,
        trade_id: tradeId,
        amount: value,
        status: "agreed_offline",
        is_offline_agreement: true,
        agreed_at: agreedIso,
        offline_recorded_by: user.id,
        offline_notes: notes?.trim() || null,
        pdf_path: quotePath,
        contract_pdf_path: contractPath,
        message: notes?.trim() ||
          "Quote agreed directly with the homeowner before the platform's quote tools were used. Recorded for the project record.",
      })
      .select("id, reference")
      .single();

    if (insErr || !quoteRow) {
      return json({ error: `Could not record quote: ${insErr?.message}` }, 500);
    }

    // In-progress job — not "new quote awaiting review".
    await admin.from("jobs").update({ status: "in_progress" }).eq("id", jobId);

    // Mark the invitation as agreed offline so the standard chase/escalation
    // logic stops treating this job as awaiting a quote.
    await admin
      .from("job_trade_invitations")
      .update({ status: "quote_submitted", responded_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("trade_id", tradeId);

    let emailed = false;
    if (notifyHomeowner && job.homeowner_id) {
      const { data: owner } = await admin
        .from("homeowners")
        .select("email, name")
        .eq("id", job.homeowner_id)
        .maybeSingle();
      const { data: trade } = await admin
        .from("trades")
        .select("company_name, name")
        .eq("id", tradeId)
        .maybeSingle();
      if (owner?.email) {
        const res = await admin.functions.invoke("send-transactional-email", {
          body: {
            templateName: "agreed-quote-on-file",
            recipientEmail: owner.email,
            idempotencyKey: `agreed-quote-on-file-${quoteRow.id}`,
            templateData: {
              firstName: owner.name?.split(" ")[0] || undefined,
              tradeName: trade?.company_name || trade?.name || "your trade",
              amount: `£${value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
              projectTitle: job.title || job.job_type || "your project",
              projectAddress: [job.address, job.postcode].filter(Boolean).join(", ") || undefined,
              jobId,
            },
          },
        });
        emailed = !res.error;
      }
    }

    return json({
      success: true,
      quoteId: quoteRow.id,
      reference: quoteRow.reference,
      quotePath,
      contractPath,
      emailed,
      jobStatus: "in_progress",
    });
  } catch (err) {
    console.error("record-agreed-quote error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
