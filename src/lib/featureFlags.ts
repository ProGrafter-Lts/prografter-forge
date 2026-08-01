// Feature flags for staged rollouts. Flip to true to expose to users.
export const FEATURE_FLAGS = {
  // Professional Quote PDF (Schedule of Works). Backend + edge function are
  // live; UI entry points stay hidden until we're ready to ship.
  quotePdf: true,
  // QuickBuild MVP v0.5 — AI-assisted quote draft from voice + photos.
  // Edge function, table, and storage bucket are live; route + entry button
  // stay hidden until we're ready to ship.
  quickBuild: true,
  // Informational only — the actual Pass 0/1/2 Quote Checker rebuild switch
  // for Landscaping/Driveway is server-side, in
  // supabase/functions/_shared/quote-checker-v2-flags.ts (flipped once the
  // consistency gate passes). This flag doesn't gate anything on its own;
  // it's here for any future UI indicator that v2 is live.
  quoteCheckerV2Landscaping: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlag) => FEATURE_FLAGS[flag];
