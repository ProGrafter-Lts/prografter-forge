import { supabase } from "@/integrations/supabase/client";
import { ATLAS_SECTIONS } from "./sections";

/**
 * Seed the default set of sections + starter prompts for a survey.
 * Runs on demand — no-op if sections already exist.
 */
export async function ensureAtlasSections(surveyId: string) {
  const { data: existing } = await (supabase as any)
    .from("atlas_sections")
    .select("id")
    .eq("survey_id", surveyId)
    .limit(1);

  if (existing && existing.length > 0) return;

  const rows = ATLAS_SECTIONS.map((s) => ({
    survey_id: surveyId,
    section_key: s.key,
    title: s.title,
    category: s.category,
    sequence: s.sequence,
  }));

  const { data: inserted, error } = await (supabase as any)
    .from("atlas_sections")
    .insert(rows)
    .select("id, section_key");

  if (error) throw error;

  // Seed prompts as observations (response_status='answered' but empty text so user fills them)
  const promptRows: any[] = [];
  for (const s of ATLAS_SECTIONS) {
    const sectionRow = (inserted || []).find((r: any) => r.section_key === s.key);
    if (!sectionRow) continue;
    for (const p of s.prompts) {
      promptRows.push({
        survey_id: surveyId,
        section_id: sectionRow.id,
        title: p.title,
        classification: "unknown",
        confidence_level: "unverified",
        response_status: "unknown",
        is_required: !!p.is_required,
        is_critical: !!p.is_critical,
        internal_note: p.hint ?? null,
      });
    }
  }
  if (promptRows.length) {
    await (supabase as any).from("atlas_observations").insert(promptRows);
  }
}

export async function recomputeSurveyProgress(surveyId: string) {
  const { data: obs } = await (supabase as any)
    .from("atlas_observations")
    .select("id, section_id, is_required, is_critical, response_status, skip_reason")
    .eq("survey_id", surveyId);

  const list = (obs || []) as any[];
  const total = list.length || 1;
  const answered = list.filter((o) => o.response_status === "answered").length;
  const completion = Math.round((answered / total) * 100);

  await (supabase as any)
    .from("atlas_surveys")
    .update({ completion_percentage: completion })
    .eq("id", surveyId);

  // Section-level
  const bySection = new Map<string, any[]>();
  list.forEach((o) => {
    const arr = bySection.get(o.section_id) || [];
    arr.push(o);
    bySection.set(o.section_id, arr);
  });
  for (const [sectionId, items] of bySection.entries()) {
    const t = items.length;
    const a = items.filter((o) => o.response_status === "answered").length;
    const critOutstanding = items.filter(
      (o) => o.is_critical && o.response_status !== "answered" && !o.skip_reason,
    ).length;
    await (supabase as any)
      .from("atlas_sections")
      .update({
        completion_percentage: t ? Math.round((a / t) * 100) : 0,
        completion_status: a === 0 ? "not_started" : a === t ? "completed" : "in_progress",
        critical_outstanding_count: critOutstanding,
      })
      .eq("id", sectionId);
  }

  return { completion, total, answered };
}

export async function logAtlasAudit(
  surveyId: string,
  entityType: string,
  entityId: string | null,
  action: string,
  reason?: string,
  prev?: any,
  next?: any,
) {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return;
  await (supabase as any).from("atlas_audit_events").insert({
    survey_id: surveyId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    reason,
    previous_value: prev ?? null,
    new_value: next ?? null,
    performed_by: uid,
  });
}

export function statusPill(status: string) {
  switch (status) {
    case "draft":
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    case "in_progress":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "paused":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "ready_for_review":
      return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "superseded":
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
  }
}
