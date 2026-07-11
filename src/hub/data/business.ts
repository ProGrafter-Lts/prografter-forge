/* ============================================================
   ProGrafter Planning Hub — builder business profile.
   Single source of truth for the signed-in trade's company
   details. Used by the Introduction Letter generator and
   anywhere else the business identity is shown.
   ============================================================ */

export interface BusinessProfile {
  contactName: string;
  businessName: string;
  tradeType: string;
  email: string;
  phone: string;
  serviceArea: string;
  website?: string;
  registrationNo?: string;
}

const STORAGE_KEY = "pg-hub-business-profile";

const DEFAULT_PROFILE: BusinessProfile = {
  contactName: "Lee Bennett",
  businessName: "Bennett Building Ltd",
  tradeType: "Building & Extensions",
  email: "lee@bennettbuilding.co.uk",
  phone: "07700 900123",
  serviceArea: "Guildford & Surrey",
  website: "bennettbuilding.co.uk",
  registrationNo: "Company No. 08472913",
};

/** Read the business profile (merges any saved overrides). */
export const getBusinessProfile = (): BusinessProfile => {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
};

/** Persist edits to the business profile. */
export const saveBusinessProfile = (profile: Partial<BusinessProfile>) => {
  if (typeof window === "undefined") return;
  const merged = { ...getBusinessProfile(), ...profile };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
};
