import { supabase } from "@/integrations/supabase/client";
import {
  quoteAssumptionsFromSurvey,
  quoteProvisionalSumsFromSurvey,
} from "@/atlas/capture/atlas-survey-schema";

export const ATLAS_HANDOFF_HEADING = "From Atlas site survey:";

export interface AtlasQuoteHandoff {
  /** Text for the quote's free-text assumptions field. */
  assumptions: string;
  /** Text for the quote's dedicated provisional-sums field. */
  provisionalSums: string;
}

/**
 * Pull the latest Atlas capture for a job and split its risk flags into the
 * quote wizard's assumptions text and its dedicated provisional-sums field,
 * so the ground-conditions risk is carried as a priced provisional sum rather
 * than buried in free-text assumptions.
 */
export async function getAtlasQuoteHandoff(jobId: string): Promise<AtlasQuoteHandoff | null> {
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

  return {
    assumptions: [ATLAS_HANDOFF_HEADING, quoteAssumptionsFromSurvey(values)].join("\n"),
    provisionalSums: [ATLAS_HANDOFF_HEADING, `• ${quoteProvisionalSumsFromSurvey(values)}`].join("\n"),
  };
}
