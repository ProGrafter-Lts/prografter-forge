import { supabase } from "@/integrations/supabase/client";
import {
  quoteAssumptionsFromSurvey,
  quoteProvisionalSumsFromSurvey,
} from "@/atlas/capture/atlas-survey-schema";

export const ATLAS_HANDOFF_HEADING = "From Atlas site survey:";

/**
 * Pull the latest Atlas capture for a job and turn its risk flags into text
 * for the quote wizard's assumptions / provisional-sums wording, so the
 * ground-conditions risk reaches the homeowner before pricing is finalised.
 */
export async function getAtlasQuoteHandoff(jobId: string): Promise<string | null> {
  const { data: surveys } = await (supabase as any)
    .from("atlas_surveys")
    .select("id")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1);

  const surveyId = surveys?.[0]?.id;
  if (!surveyId) return null;

  const { data: fields } = await (supabase as any)
    .from("atlas_survey_fields")
    .select("field_key, value")
    .eq("survey_id", surveyId);

  if (!fields || fields.length === 0) return null;

  const values: Record<string, any> = {};
  for (const f of fields as any[]) values[f.field_key] = f.value;

  return [
    ATLAS_HANDOFF_HEADING,
    quoteAssumptionsFromSurvey(values),
    "",
    "Provisional sums:",
    `• ${quoteProvisionalSumsFromSurvey(values)}`,
  ].join("\n");
}
