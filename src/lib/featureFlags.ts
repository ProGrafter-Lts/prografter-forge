// Feature flags for staged rollouts. Flip to true to expose to users.
export const FEATURE_FLAGS = {
  // Professional Quote PDF (Schedule of Works). Backend + edge function are
  // live; UI entry points stay hidden until we're ready to ship.
  quotePdf: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlag) => FEATURE_FLAGS[flag];
