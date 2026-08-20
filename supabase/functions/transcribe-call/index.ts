// deno-lint-ignore-file no-explicit-any
// Scoping-call transcription + structured field extraction.
//
// Two stages, because the Claude Messages API accepts text/images/PDF but NOT
// raw audio:
//   1. speech-to-text  — Lovable AI Gateway /v1/audio/transcriptions
//                        (openai/gpt-4o-transcribe)
//   2. extraction      — Anthropic Claude with a tool schema built from the
//                        call form's own field list (same pattern as the
//                        Quote Checker extractors)
//
// The function writes the transcript back onto the call note but NEVER writes
// the extracted answers — those are returned to the admin UI for review.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const MAX_BYTES = 24 * 1024 * 1024; // gateway rejects > 25 MiB
const CLAUDE_MODEL = "claude-sonnet-4-6";
const MAX_TRANSCRIPT_CHARS = 60000;

interface FieldSpec {
  key: string;
  label: string;
  kind?: string;
  options?: string[];
  section?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extFor = (path: string, fallback = "webm") => {
  const m = /\.([a-z0-9]{2,5})$/i.exec(path);
  return m ? m[1].toLowerCase() : fallback;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: authData, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = authData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Admin-only: this endpoint reads private call recordings.
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const callNoteId = typeof body?.callNoteId === "string" ? body.callNoteId : "";
    if (!callNoteId) return json({ error: "callNoteId is required" }, 400);
    const fields: FieldSpec[] = Array.isArray(body?.fields) ? body.fields.slice(0, 200) : [];
    const mode = body?.mode === "extract_only" ? "extract_only" : "full";

    const { data: note, error: noteErr } = await admin
      .from("customer_call_notes")
      .select("id, call_type, recording_path, transcript_text, homeowner_name")
      .eq("id", callNoteId)
      .single();
    if (noteErr || !note) return json({ error: "Call note not found" }, 404);

    // ---- Stage 1: speech-to-text -------------------------------------------
    let transcript = (typeof body?.transcript === "string" ? body.transcript : "") ||
      (note.transcript_text ?? "");

    if (mode === "full") {
      if (!note.recording_path) {
        return json({ error: "No recording on this call — paste a transcript instead." }, 400);
      }
      const { data: file, error: dlErr } = await admin.storage
        .from("call-recordings")
        .download(note.recording_path);
      if (dlErr || !file) return json({ error: "Could not read the recording file." }, 400);
      if (file.size < 2048) {
        return json({ error: "Recording is empty or too short to transcribe." }, 400);
      }
      if (file.size > MAX_BYTES) {
        return json({
          error:
            "Recording is too large to transcribe in one pass (over 24 MB). Record shorter segments or paste the transcript manually.",
        }, 413);
      }

      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

      const form = new FormData();
      form.append("model", "openai/gpt-4o-transcribe");
      form.append("file", file, `recording.${extFor(note.recording_path)}`);

      const sttRes = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}` },
        body: form,
      });
      if (!sttRes.ok) {
        const detail = await sttRes.text().catch(() => "");
        return json({ error: `Transcription failed (${sttRes.status}). ${detail.slice(0, 400)}` }, sttRes.status);
      }
      const sttJson: any = await sttRes.json();
      transcript = (sttJson?.text ?? "").toString().trim();
      if (!transcript) return json({ error: "Transcription returned no text." }, 502);

      await admin
        .from("customer_call_notes")
        .update({ transcript_text: transcript, updated_at: new Date().toISOString() })
        .eq("id", callNoteId);
    }

    if (!transcript.trim()) {
      return json({ error: "No transcript available to extract from." }, 400);
    }

    // ---- Stage 2: structured extraction with Claude -------------------------
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      // Transcription still succeeded — return it so the admin isn't blocked.
      return json({ transcript, answers: {}, summary: null, warning: "ANTHROPIC_API_KEY not configured — extraction skipped." });
    }

    const properties: Record<string, any> = {};
    const optionsFor = (f: FieldSpec): string[] | null =>
      f.options?.length ? f.options : f.kind === "yesno" ? ["Yes", "No", "Unknown"] : null;

    for (const f of fields) {
      if (!f?.key || typeof f.key !== "string") continue;
      const opts = optionsFor(f);
      properties[f.key] = opts
        ? { type: "string", enum: [...opts, ""], description: f.label }
        : { type: "string", description: f.label };
    }
    properties.__summary = {
      type: "string",
      description: "A concise factual summary of the call (6-12 bullet lines), written for an internal admin reviewer.",
    };
    properties.__key_concerns = {
      type: "string",
      description: "The homeowner's main concerns in one or two sentences.",
    };
    properties.__next_steps = {
      type: "string",
      description: "Agreed or recommended next steps from the call.",
    };

    const tool = {
      name: "record_call_fields",
      description: "Fill in the ProGrafter scoping-call form from the transcript.",
      input_schema: { type: "object", properties, required: [] as string[] },
    };

    const system =
      "You extract structured data from UK home-improvement scoping call transcripts for ProGrafter (internal admin tool).\n" +
      "Rules:\n" +
      "- Only record what the transcript actually supports. Never guess, infer prices, or invent detail.\n" +
      "- If a field is not discussed, omit it entirely (do not output an empty string for it).\n" +
      "- For fields with allowed values, choose exactly one of the allowed values or omit the field.\n" +
      "- Keep free-text fields short, factual and in plain British English.\n" +
      "- Transcripts are auto-generated and may contain errors; do not repeat obvious mis-hearings as fact.";

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        system,
        tools: [tool],
        tool_choice: { type: "tool", name: "record_call_fields" },
        messages: [{
          role: "user",
          content:
            `Call type: ${note.call_type}\nHomeowner: ${note.homeowner_name ?? "unknown"}\n\n` +
            `Transcript:\n"""\n${transcript.slice(0, MAX_TRANSCRIPT_CHARS)}\n"""`,
        }],
      }),
    });

    if (!claudeRes.ok) {
      const detail = await claudeRes.text().catch(() => "");
      return json({
        transcript,
        answers: {},
        summary: null,
        warning: `Transcript saved, but field extraction failed (${claudeRes.status}). ${detail.slice(0, 300)}`,
      });
    }

    const claudeJson: any = await claudeRes.json();
    const toolUse = (claudeJson?.content ?? []).find((c: any) => c.type === "tool_use");
    const raw: Record<string, any> = toolUse?.input ?? {};

    const allowed = new Map(fields.map((f) => [f.key, f]));
    const answers: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k.startsWith("__")) continue;
      const spec = allowed.get(k);
      if (!spec) continue;
      const val = typeof v === "string" ? v.trim() : "";
      if (!val) continue;
      const opts = optionsFor(spec);
      if (opts && !opts.includes(val)) continue;
      answers[k] = val;
    }

    return json({
      transcript,
      answers,
      summary: typeof raw.__summary === "string" ? raw.__summary : null,
      key_concerns: typeof raw.__key_concerns === "string" ? raw.__key_concerns : null,
      next_steps: typeof raw.__next_steps === "string" ? raw.__next_steps : null,
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
