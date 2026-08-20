import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight "I'm interested" signal for a job match.
 *
 * Distinct from submitting a quote: it records intent only, so the
 * Invited / Viewed / Interested / Quotes counters reflect real trade behaviour
 * without forcing the trade to price the job first.
 */
export const registerJobInterest = async (opts: {
  matchId: string;
  jobId: string;
  tradeId: string;
}): Promise<{ ok: boolean; error?: string }> => {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("job_matches")
    .update({ interested_at: now })
    .eq("id", opts.matchId)
    .eq("trade_id", opts.tradeId);

  if (error) {
    console.error("Failed to register job interest", error);
    return { ok: false, error: error.message };
  }

  // Keep the invitation funnel in step when an invitation row exists.
  try {
    await supabase
      .from("job_trade_invitations")
      .update({ status: "interested", responded_at: now, viewed_at: now })
      .eq("job_id", opts.jobId)
      .eq("trade_id", opts.tradeId)
      .neq("status", "quote_submitted");
  } catch {
    /* non-blocking */
  }

  return { ok: true };
};

/** Records that the trade opened the job, feeding the "Viewed" counter. */
export const registerJobViewed = async (jobId: string, tradeId: string) => {
  try {
    await supabase
      .from("job_trade_invitations")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("trade_id", tradeId)
      .eq("status", "invited");
  } catch {
    /* non-blocking */
  }
};
