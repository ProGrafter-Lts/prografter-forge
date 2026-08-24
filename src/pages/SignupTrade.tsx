import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { z } from "zod";
import { Leaf, Check, ShieldCheck, IdCard, Award, CheckCircle2 } from "lucide-react";

const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB

const qualificationCopy = (tradeType: string): { label: string; helper: string; required: boolean } => {
  const t = tradeType.toLowerCase();
  if (t.includes("electrician")) return { label: "Trade qualification — NICEIC, NAPIT or ECA", helper: "NICEIC, NAPIT, or ECA registration card or certificate", required: true };
  if (t.includes("gas") || t === "plumber") return { label: "Trade qualification — Gas Safe", helper: "Gas Safe Register card — front and back", required: true };
  if (t.includes("oil")) return { label: "Trade qualification — OFTEC", helper: "OFTEC registration certificate", required: true };
  if (t.includes("solar") || t.includes("heat pump") || t.includes("biomass")) return { label: "Trade qualification — MCS", helper: "MCS certification", required: true };
  if (t.includes("ev") || t.includes("charger")) return { label: "Trade qualification — OZEV", helper: "OZEV-approved installer registration", required: true };
  if (t.includes("builder") || t.includes("contractor")) return { label: "Trade qualification — City & Guilds / NVQ", helper: "City & Guilds, NVQ Level 2/3, or other relevant qualification", required: false };
  if (t.includes("scaffold")) return { label: "Trade qualification — CISRS", helper: "CISRS card", required: true };
  if (!tradeType || t === "other") return { label: "Trade qualification", helper: "Any relevant qualification, accreditation, or membership certificate", required: false };
  return { label: "Trade qualification", helper: "Any relevant qualification, accreditation, or membership certificate (strongly preferred)", required: false };
};
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { buildServiceJsonLd } from "@/lib/seoSchemas";
import {
  RENEWABLE_TRADE_TYPES,
  isGreenTrade,
  showOzev,
  showFgas,
  showCiga,
  showInca,
} from "@/lib/greenTrades";
import { saveTradeSpecialisms } from "@/lib/specialisms";
import { useSetupRedirect, SetupRedirectLoader } from "@/hooks/useSetupRedirect";
import { useAuthReady } from "@/hooks/useAuthReady";
import TradeVerificationExplainer from "@/components/TradeVerificationExplainer";
import { classifyTrade, type VerificationRoute, SCHEME_LABEL } from "@/lib/tradeBanding";
import Logo from "@/components/Logo";

type ReferenceDraft = {
  contact_name: string;
  relationship: "past_customer" | "trade_contact" | "supplier" | "other";
  phone: string;
  email: string;
};
const blankRef = (): ReferenceDraft => ({ contact_name: "", relationship: "past_customer", phone: "", email: "" });

type PortfolioDraft = {
  id?: string;
  storage_path: string;
  preview_name: string;
  area_or_address: string;
  approx_date: string; // YYYY-MM
  caption: string;
};

const SpecialismsPicker = lazy(() => import("@/components/SpecialismsPicker"));
const TradeDateField = lazy(() => import("@/components/trade/TradeDateField"));

const GENERAL_TRADE_TYPES = [
  "Electrician",
  "Plumber",
  "Gas Engineer",
  "Builder",
  "Roofer",
  "Plasterer",
  "Carpenter",
  "Tiler",
  "Decorator",
  "Scaffolder",
  "Landscaper",
  "Other",
] as const;

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

// ── Service-area gate ────────────────────────────────────────────────
// We are only live across NG, DE, LE, LN, S and DN postcodes. Trade
// sign-ups from postcode areas outside this list are routed to a waitlist.
// EDIT THIS SINGLE LIST to expand our launch area.
const LAUNCH_AREA_PREFIXES = ["NG", "DE", "LE", "LN", "S", "DN", "NN"] as const;
const isInLaunchArea = (postcode: string): boolean => {
  // Match on the alphabetic postcode area (e.g. "SW1A 1AA" → "SW", "S1 2AB" → "S")
  const area = postcode.trim().toUpperCase().replace(/\s+/g, "").match(/^[A-Z]+/)?.[0] ?? "";
  return (LAUNCH_AREA_PREFIXES as readonly string[]).includes(area);
};
const COMPANIES_HOUSE_NUMBER = /^([A-Z]{2}\d{6}|\d{8})$/;
const normaliseChNumber = (v: string) => v.replace(/\s+/g, "").toUpperCase();

const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters"),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  postcode: z.string().trim().regex(UK_POSTCODE, "Enter a valid UK postcode"),
  agreedTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to continue" }) }),
});

type Step = 1 | 2 | 3 | 4;

const labelClass = "block font-mono text-xs text-teal uppercase tracking-widest mb-1.5";
const inputClass =
  "w-full bg-cream/5 border border-cream/10 text-cream placeholder-cream/40 font-body text-sm rounded-xl px-4 py-3 focus:border-teal focus:outline-none transition-colors";
const checkboxClass = "w-4 h-4 rounded border-cream/20 bg-cream/5 accent-teal cursor-pointer";

type ExistingDoc = { name: string; expiry: string | null };

const SignupTrade = () => {
  const navigate = useNavigate();
  const checkingExisting = useSetupRedirect("trade");
  const { isReady, user } = useAuthReady();
  const [gatePassed, setGatePassed] = useState(false);
  // Service-area gate state
  const [outOfArea, setOutOfArea] = useState(false);
  const [waitlistTrade, setWaitlistTrade] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [resuming, setResuming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");
  const skipNextAutosaveRef = useRef(false);
  const [existingDocs, setExistingDocs] = useState<{
    insurance?: ExistingDoc;
    id?: ExistingDoc;
    qualification?: ExistingDoc;
  }>({});

  // Step 1: account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Step 2: business
  const [tradeType, setTradeType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessStructure, setBusinessStructure] = useState<"" | "sole_trader" | "limited_company" | "partnership">("");
  const [companiesHouseNumber, setCompaniesHouseNumber] = useState("");
  const [companiesHouseError, setCompaniesHouseError] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [specialismIds, setSpecialismIds] = useState<string[]>([]);
  const [primarySpecialismId, setPrimarySpecialismId] = useState<string | null>(null);
  // Green
  const [mcsNumber, setMcsNumber] = useState("");
  const [trustmarkNumber, setTrustmarkNumber] = useState("");
  const [pas2030, setPas2030] = useState(false);
  const [pas2035, setPas2035] = useState(false);
  const [ozevApproved, setOzevApproved] = useState(false);
  const [fgasRegistered, setFgasRegistered] = useState(false);
  const [cigaRegistered, setCigaRegistered] = useState(false);
  const [incaCertified, setIncaCertified] = useState(false);
  const [greenCertExpiry, setGreenCertExpiry] = useState<Date | undefined>();

  // Step 3: documents
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceExpiry, setInsuranceExpiry] = useState<Date | undefined>();
  const [idFile, setIdFile] = useState<File | null>(null);
  const [qualFile, setQualFile] = useState<File | null>(null);
  const [qualExpiry, setQualExpiry] = useState<Date | undefined>();
  const [docsConfirmed, setDocsConfirmed] = useState(false);

  // Banding + route
  const bandConfig = useMemo(() => classifyTrade(tradeType), [tradeType]);
  const [chosenRoute, setChosenRoute] = useState<VerificationRoute | "">("");
  const [showRouteChoice, setShowRouteChoice] = useState(false);

  // Time-served: portfolio + references
  const [portfolio, setPortfolio] = useState<PortfolioDraft[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [references, setReferences] = useState<ReferenceDraft[]>([blankRef(), blankRef()]);
  const isTimeServed = chosenRoute === "time_served";

  const qualMeta = qualificationCopy(tradeType);
  const isGreen = isGreenTrade(tradeType);

  const [uploadingDoc, setUploadingDoc] = useState<{ insurance?: boolean; id?: boolean; qualification?: boolean }>({});
  const [docAutosave, setDocAutosave] = useState<"idle" | "saving" | "saved">("idle");

  const handleFile = (
    setter: (f: File | null) => void,
    docType: "insurance" | "id" | "qualification",
    expiryFn?: () => Date | undefined,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_DOC_BYTES) {
      setError(`${f.name} is over 10MB. Please upload a smaller file.`);
      e.target.value = "";
      return;
    }
    setError("");
    setter(f);
    setDocsConfirmed(false);
    // Autosave: upload immediately so the file persists across refresh.
    if (f && createdUserId && createdTradeId) {
      void autoUploadDoc(f, docType, expiryFn?.());
    }
  };

  // Account info created during step 1
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdTradeId, setCreatedTradeId] = useState<string | null>(null);

  // Resume a partially-completed signup. If the user already created an
  // account (Step 1) but never submitted for review, hydrate their saved
  // data and drop them at the right step instead of forcing a restart.
  useEffect(() => {
    if (!isReady || !user || createdTradeId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trades")
        .select(
          "id, name, company_name, phone, postcode, trade_type, years_experience, website, bio, mcs_number, trustmark_number, pas_2030_accredited, pas_2035_coordinator, ozev_approved, fgas_registered, ciga_registered, inca_certified, green_cert_expiry, insurance_cert_url, insurance_expiry, submitted_for_review_at, business_structure, companies_house_number, verification_route, band",
        )
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      // Don't resume if they've already submitted — useSetupRedirect handles that.
      if ((data as any).submitted_for_review_at) return;

      setResuming(true);
      setCreatedUserId(user.id);
      setCreatedTradeId((data as any).id);
      setGatePassed(true);
      setFullName((data as any).name ?? "");
      setEmail(user.email ?? "");
      setPhone((data as any).phone ?? "");
      setPostcode((data as any).postcode ?? "");
      setAgreedTerms(true);

      const tt = (data as any).trade_type ?? "";
      // 'Other' is the placeholder set by handle_new_user — treat as empty.
      setTradeType(tt && tt !== "Other" ? tt : "");
      setCompanyName((data as any).company_name ?? "");
      setBusinessStructure(((data as any).business_structure as any) ?? "");
      setCompaniesHouseNumber((data as any).companies_house_number ?? "");
      setYearsExperience(
        (data as any).years_experience != null ? String((data as any).years_experience) : "",
      );
      setWebsite((data as any).website ?? "");
      setBio((data as any).bio ?? "");
      setMcsNumber((data as any).mcs_number ?? "");
      setTrustmarkNumber((data as any).trustmark_number ?? "");
      setPas2030(!!(data as any).pas_2030_accredited);
      setPas2035(!!(data as any).pas_2035_coordinator);
      setOzevApproved(!!(data as any).ozev_approved);
      setFgasRegistered(!!(data as any).fgas_registered);
      setCigaRegistered(!!(data as any).ciga_registered);
      setIncaCertified(!!(data as any).inca_certified);
      if ((data as any).verification_route) setChosenRoute((data as any).verification_route);

      // Figure out which step to drop them at. Prefer the explicitly-saved
      // step from localStorage (so Step 4 survives a refresh), but never let
      // the saved step skip ahead of what data actually exists.
      const hasBusiness = !!(data as any).trade_type && (data as any).trade_type !== "Other";
      const hasDocs = !!(data as any).insurance_cert_url;
      const maxAllowed: Step = hasDocs ? 4 : hasBusiness ? 3 : 2;
      let resumeStep: Step = maxAllowed;
      try {
        const saved = localStorage.getItem(`trade-signup-step:${(data as any).id}`);
        const n = saved ? parseInt(saved, 10) : NaN;
        if (n === 2 || n === 3 || n === 4) {
          resumeStep = (Math.min(n, maxAllowed) as Step);
        }
      } catch { /* non-blocking */ }
      setStep(resumeStep);

      // Hydrate previously-uploaded document metadata so the user
      // doesn't have to re-upload on resume.
      try {
        const { data: docs } = await supabase
          .from("trade_verification_documents")
          .select("doc_type, original_filename, expiry_date, created_at")
          .eq("trade_id", (data as any).id)
          .order("created_at", { ascending: false });
        if (!cancelled && docs && docs.length > 0) {
          const seen: Record<string, ExistingDoc> = {};
          for (const d of docs as any[]) {
            if (seen[d.doc_type]) continue; // keep most recent only
            seen[d.doc_type] = { name: d.original_filename, expiry: d.expiry_date };
          }
          setExistingDocs(seen);
          if (seen.insurance?.expiry) {
            setInsuranceExpiry(new Date(seen.insurance.expiry));
          } else if ((data as any).insurance_expiry) {
            setInsuranceExpiry(new Date((data as any).insurance_expiry));
          }
          if (seen.qualification?.expiry) {
            setQualExpiry(new Date(seen.qualification.expiry));
          }
        }
      } catch { /* non-blocking */ }

      // Block the next autosave so hydration doesn't immediately re-write
      // the same values back to the database.
      skipNextAutosaveRef.current = true;
    })();
    return () => { cancelled = true; };
  }, [isReady, user, createdTradeId]);

  // Debounced autosave for Step 2 — every keystroke/toggle/date change is
  // persisted to the trades row so users can refresh or leave and come back
  // to exactly the same state.
  useEffect(() => {
    if (!createdTradeId) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    const handle = window.setTimeout(async () => {
      setAutosaveState("saving");
      const chNorm = normaliseChNumber(companiesHouseNumber);
      const chValid = !chNorm || COMPANIES_HOUSE_NUMBER.test(chNorm);
      const updates: Record<string, unknown> = {
        trade_type: tradeType || null,
        company_name: companyName.trim() || null,
        business_structure: businessStructure || null,
        // Only persist a CH number once it's a valid 8-char format; otherwise leave null
        // so the DB trigger doesn't reject the autosave.
        companies_house_number: chValid ? (chNorm || null) : null,
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        is_green_trade: isGreen,
        mcs_number: mcsNumber.trim() || null,
        trustmark_number: trustmarkNumber.trim() || null,
        pas_2030_accredited: pas2030,
        pas_2035_coordinator: pas2035,
        ozev_approved: ozevApproved,
        fgas_registered: fgasRegistered,
        ciga_registered: cigaRegistered,
        inca_certified: incaCertified,
        green_cert_expiry: greenCertExpiry ? format(greenCertExpiry, "yyyy-MM-dd") : null,
      };
      const { error: saveErr } = await supabase
        .from("trades")
        .update(updates as any)
        .eq("id", createdTradeId);
      if (saveErr) {
        console.warn("Autosave failed (non-blocking)", saveErr);
        setAutosaveState("idle");
      } else {
        setAutosaveState("saved");
        window.setTimeout(() => setAutosaveState((s) => (s === "saved" ? "idle" : s)), 1500);
      }
    }, 800);
    return () => window.clearTimeout(handle);
  }, [
    createdTradeId, tradeType, companyName, businessStructure, companiesHouseNumber,
    yearsExperience, website, bio, isGreen,
    mcsNumber, trustmarkNumber, pas2030, pas2035, ozevApproved, fgasRegistered,
    cigaRegistered, incaCertified, greenCertExpiry,
  ]);

  // Debounced autosave for Step 3 expiry dates — keeps the most-recent
  // doc row in sync when the user adjusts a date after uploading.
  useEffect(() => {
    if (!createdTradeId) return;
    if (!existingDocs.insurance && !existingDocs.qualification) return;
    const handle = window.setTimeout(async () => {
      setDocAutosave("saving");
      try {
        if (existingDocs.insurance && insuranceExpiry) {
          const iso = format(insuranceExpiry, "yyyy-MM-dd");
          if (iso !== existingDocs.insurance.expiry) {
            await supabase
              .from("trade_verification_documents")
              .update({ expiry_date: iso } as any)
              .eq("trade_id", createdTradeId)
              .eq("doc_type", "insurance");
            await supabase
              .from("trades")
              .update({ insurance_expiry: iso } as any)
              .eq("id", createdTradeId);
            setExistingDocs((d) => ({ ...d, insurance: d.insurance ? { ...d.insurance, expiry: iso } : d.insurance }));
          }
        }
        if (existingDocs.qualification) {
          const iso = qualExpiry ? format(qualExpiry, "yyyy-MM-dd") : null;
          if (iso !== existingDocs.qualification.expiry) {
            await supabase
              .from("trade_verification_documents")
              .update({ expiry_date: iso } as any)
              .eq("trade_id", createdTradeId)
              .eq("doc_type", "qualification");
            setExistingDocs((d) => ({ ...d, qualification: d.qualification ? { ...d.qualification, expiry: iso } : d.qualification }));
          }
        }
        setDocAutosave("saved");
        window.setTimeout(() => setDocAutosave((s) => (s === "saved" ? "idle" : s)), 1500);
      } catch (err) {
        console.warn("Doc expiry autosave failed", err);
        setDocAutosave("idle");
      }
    }, 800);
    return () => window.clearTimeout(handle);
  }, [createdTradeId, insuranceExpiry, qualExpiry, existingDocs.insurance, existingDocs.qualification]);


  const insuranceStatus = useMemo(() => {
    if (!insuranceExpiry) return null;
    const days = differenceInDays(insuranceExpiry, new Date());
    if (days < 0) return "expired";
    if (days <= 30) return "expiring";
    return "valid";
  }, [insuranceExpiry]);

  // Persist the current step so a refresh on Step 4 (or any later step)
  // returns the user to the same place instead of bouncing them back.
  useEffect(() => {
    if (!createdTradeId) return;
    try {
      localStorage.setItem(`trade-signup-step:${createdTradeId}`, String(step));
    } catch { /* non-blocking */ }
  }, [createdTradeId, step]);

  // ---- STEP 1: create auth user + trade row (pending) ----
  const submitStep1 = async () => {
    setError("");
    const parsed = step1Schema.safeParse({
      fullName, email, password, phone, postcode, agreedTerms,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    // Service-area gate: out-of-area trades go to the waitlist, not sign-up.
    if (!isInLaunchArea(postcode)) {
      setError("");
      setOutOfArea(true);
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/register/trade`,
          data: {
            user_type: "trade",
            full_name: fullName.trim(),
            phone: phone.trim(),
            postcode: postcode.trim().toUpperCase(),
            company_name: companyName.trim() || fullName.trim(),
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      const userId = signUpData.user?.id ?? null;
      setCreatedUserId(userId);

      // Consents (best-effort)
      if (userId) {
        try {
          await supabase.from("consents_log").insert([
            { user_id: userId, consent_type: "terms", consented: true, user_agent: navigator.userAgent },
            { user_id: userId, consent_type: "marketing", consented: marketingOptIn, user_agent: navigator.userAgent },
          ]);
        } catch { /* non-blocking */ }
      }

      // Welcome email (best-effort — failure must not block signup)
      if (userId) {
        try {
          const firstName = fullName.trim().split(/\s+/)[0] || "";
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "trade-welcome",
              recipientEmail: email.trim(),
              idempotencyKey: `trade-welcome-${userId}`,
              templateData: { firstName },
            },
          });
          // Delivery-check email — proves our emails reach this inbox.
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "delivery-confirmation",
              recipientEmail: email.trim(),
              idempotencyKey: `delivery-confirmation-${userId}`,
              templateData: { firstName, audience: "trade" },
            },
          });
        } catch (e) {
          console.warn("trade-welcome email failed (non-blocking)", e);
        }

        // Admin notification — alert team that a new trade signed up
        try {
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "trade-signup-admin-notification",
              idempotencyKey: `trade-admin-signup-${userId}`,
              templateData: {
                name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                postcode: postcode.trim().toUpperCase(),
                companyName: companyName.trim() || fullName.trim(),
                tradeType,
                stage: "account_created",
              },
            },
          });
        } catch (e) {
          console.warn("trade-signup admin notification failed (non-blocking)", e);
        }
      }

      // If session not established (email confirmations on), we need to wait
      // until they verify before they can upload docs. Stash form data and
      // route to check-email page. Otherwise advance to step 2.
      if (!signUpData.session) {
        navigate("/signup/homeowner/check-email", {
          replace: true,
          state: { email: email.trim(), nextHint: "trade" },
        });
        return;
      }

      // The handle_new_user trigger created the trades row. Look it up.
      const { data: tradeRow } = await supabase
        .from("trades")
        .select("id")
        .eq("user_id", userId!)
        .maybeSingle();
      if (tradeRow?.id) setCreatedTradeId(tradeRow.id);

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 2: save business details ----
  const submitStep2 = async () => {
    setError("");
    setCompaniesHouseError("");
    if (!tradeType || !companyName.trim()) {
      setError("Trade type and company name are required");
      return;
    }
    if (!businessStructure) {
      setError("Please select your business structure");
      return;
    }
    const chNorm = normaliseChNumber(companiesHouseNumber);
    if (businessStructure === "limited_company") {
      if (!chNorm) {
        setCompaniesHouseError("Companies House number is required for limited companies");
        return;
      }
      if (!COMPANIES_HOUSE_NUMBER.test(chNorm)) {
        setCompaniesHouseError("Must be 8 digits, or 2 letters + 6 digits (e.g. SC123456)");
        return;
      }
    } else if (chNorm && !COMPANIES_HOUSE_NUMBER.test(chNorm)) {
      setCompaniesHouseError("Must be 8 digits, or 2 letters + 6 digits (e.g. SC123456)");
      return;
    }
    if (!bio.trim()) {
      const proceed = window.confirm(
        "Adding a bio improves your chances of winning jobs — are you sure you want to skip this?"
      );
      if (!proceed) return;
    }
    if (!createdTradeId) {
      setError("Account not ready — refresh and try again");
      return;
    }
    setLoading(true);
    try {
      const updates: Record<string, unknown> = {
        trade_type: tradeType,
        company_name: companyName.trim(),
        business_structure: businessStructure,
        companies_house_number: chNorm || null,
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        website: website.trim() || null,
        bio: bio.trim() || null,
        is_green_trade: isGreen,
        specialisms_prompt_seen: true,
        band: bandConfig.band,
        // Non-Band-3 trades go down the registered route automatically; Band 3 picks below.
        verification_route: bandConfig.band === "competence_assessed" ? null : "registered",
      };
      if (isGreen) {
        updates.mcs_number = mcsNumber.trim() || null;
        updates.trustmark_number = trustmarkNumber.trim() || null;
        updates.pas_2030_accredited = pas2030;
        updates.pas_2035_coordinator = pas2035;
        updates.ozev_approved = ozevApproved;
        updates.fgas_registered = fgasRegistered;
        updates.ciga_registered = cigaRegistered;
        updates.inca_certified = incaCertified;
        updates.green_cert_expiry = greenCertExpiry ? format(greenCertExpiry, "yyyy-MM-dd") : null;
      }
      const { error: updErr } = await supabase
        .from("trades")
        .update(updates as any)
        .eq("id", createdTradeId);
      if (updErr) throw updErr;

      if (specialismIds.length > 0) {
        try {
          await saveTradeSpecialisms(createdTradeId, specialismIds, primarySpecialismId);
        } catch (e) {
          console.warn("Specialisms save failed (non-blocking)", e);
        }
      }
      // Band 3 trades pick their route before moving to documents.
      if (bandConfig.band === "competence_assessed" && !chosenRoute) {
        setShowRouteChoice(true);
      } else {
        if (bandConfig.band !== "competence_assessed") setChosenRoute("registered");
        setStep(3);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your details");
    } finally {
      setLoading(false);
    }
  };

  // ---- STEP 3: upload documents ----
  const uploadDoc = async (
    file: File,
    docType: "insurance" | "id" | "qualification",
    expiry?: Date,
  ) => {
    if (!createdUserId || !createdTradeId) throw new Error("Account not ready");
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${createdUserId}/${docType}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("trade-verification-documents")
      .upload(path, file, { upsert: false });
    if (upErr) throw upErr;
    await supabase.from("trade_verification_documents").insert({
      trade_id: createdTradeId,
      doc_type: docType,
      file_path: path,
      original_filename: file.name,
      expiry_date: expiry ? format(expiry, "yyyy-MM-dd") : null,
    } as any);
    return path;
  };

  // Autosave a single document: upload to storage, replace any prior doc of
  // the same type, and update the trades row for insurance. Errors surface
  // inline but never block the form.
  const autoUploadDoc = async (
    file: File,
    docType: "insurance" | "id" | "qualification",
    expiry?: Date,
  ) => {
    if (!createdUserId || !createdTradeId) return;
    setUploadingDoc((s) => ({ ...s, [docType]: true }));
    setDocAutosave("saving");
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${createdUserId}/${docType}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("trade-verification-documents")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      // Remove prior rows of this doc_type so the latest is canonical.
      await supabase
        .from("trade_verification_documents")
        .delete()
        .eq("trade_id", createdTradeId)
        .eq("doc_type", docType);
      await supabase.from("trade_verification_documents").insert({
        trade_id: createdTradeId,
        doc_type: docType,
        file_path: path,
        original_filename: file.name,
        expiry_date: expiry ? format(expiry, "yyyy-MM-dd") : null,
      } as any);
      if (docType === "insurance") {
        const tradeUpdates: Record<string, unknown> = { insurance_cert_url: path };
        if (expiry) tradeUpdates.insurance_expiry = format(expiry, "yyyy-MM-dd");
        await supabase.from("trades").update(tradeUpdates as any).eq("id", createdTradeId);
      }
      setExistingDocs((d) => ({
        ...d,
        [docType]: { name: file.name, expiry: expiry ? format(expiry, "yyyy-MM-dd") : null },
      }));
      setDocAutosave("saved");
      window.setTimeout(() => setDocAutosave((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      console.warn("Document autosave failed", err);
      setError(err instanceof Error ? err.message : "Upload failed — please try again");
      setDocAutosave("idle");
    } finally {
      setUploadingDoc((s) => ({ ...s, [docType]: false }));
    }
  };

  const uploadDocsOnly = async () => {
    setError("");
    const hasInsurance = !!insuranceFile || !!existingDocs.insurance;
    const hasId = !!idFile || !!existingDocs.id;
    const hasQual = !!qualFile || !!existingDocs.qualification;
    if (!hasInsurance) { setError("Public liability insurance is required"); return; }
    if (!insuranceExpiry) { setError("Insurance expiry date is required"); return; }
    if (insuranceStatus === "expired") { setError("Your insurance has expired"); return; }
    if (!hasId) { setError("Photo ID is required"); return; }
    if (qualMeta.required && !hasQual) { setError(`${qualMeta.label} is required for your trade`); return; }
    setLoading(true);
    try {
      let insurancePath: string | null = null;
      if (insuranceFile) {
        insurancePath = await uploadDoc(insuranceFile, "insurance", insuranceExpiry);
        setExistingDocs((d) => ({ ...d, insurance: { name: insuranceFile.name, expiry: format(insuranceExpiry!, "yyyy-MM-dd") } }));
      }
      if (idFile) {
        await uploadDoc(idFile, "id");
        setExistingDocs((d) => ({ ...d, id: { name: idFile.name, expiry: null } }));
      }
      if (qualFile) {
        await uploadDoc(qualFile, "qualification", qualExpiry);
        setExistingDocs((d) => ({ ...d, qualification: { name: qualFile.name, expiry: qualExpiry ? format(qualExpiry, "yyyy-MM-dd") : null } }));
      }

      const tradeUpdates: Record<string, unknown> = {
        insurance_expiry: format(insuranceExpiry!, "yyyy-MM-dd"),
      };
      if (insurancePath) tradeUpdates.insurance_cert_url = insurancePath;
      await supabase.from("trades").update(tradeUpdates as any).eq("id", createdTradeId!);

      setDocsConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Time-served portfolio upload ----
  const uploadPortfolioFiles = async (files: FileList) => {
    if (!createdUserId || !createdTradeId) return;
    setUploadingPortfolio(true);
    try {
      const newItems: PortfolioDraft[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_DOC_BYTES) { setError(`${file.name} over 10MB`); continue; }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${createdUserId}/portfolio-${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("trade-verification-documents").upload(path, file, { upsert: false });
        if (upErr) { setError(upErr.message); continue; }
        const { data: ins, error: insErr } = await supabase.from("trade_portfolio_items").insert({
          trade_id: createdTradeId,
          storage_path: path,
        } as any).select("id").single();
        if (insErr) { console.warn(insErr); continue; }
        newItems.push({ id: (ins as any).id, storage_path: path, preview_name: file.name, area_or_address: "", approx_date: "", caption: "" });
      }
      setPortfolio((p) => [...p, ...newItems]);
    } finally { setUploadingPortfolio(false); }
  };

  const updatePortfolio = (idx: number, patch: Partial<PortfolioDraft>) => {
    setPortfolio((p) => p.map((it, i) => i === idx ? { ...it, ...patch } : it));
    const item = portfolio[idx];
    if (item?.id) {
      void supabase.from("trade_portfolio_items").update({
        area_or_address: patch.area_or_address ?? item.area_or_address,
        approx_date: (patch.approx_date ?? item.approx_date) ? `${patch.approx_date ?? item.approx_date}-01` : null,
        caption: patch.caption ?? item.caption,
      } as any).eq("id", item.id);
    }
  };

  const removePortfolio = async (idx: number) => {
    const item = portfolio[idx];
    if (item?.id) await supabase.from("trade_portfolio_items").delete().eq("id", item.id);
    if (item?.storage_path) await supabase.storage.from("trade-verification-documents").remove([item.storage_path]);
    setPortfolio((p) => p.filter((_, i) => i !== idx));
  };

  // Hydrate portfolio rows on resume
  useEffect(() => {
    if (!createdTradeId || !isTimeServed) return;
    (async () => {
      const { data } = await supabase
        .from("trade_portfolio_items")
        .select("id, storage_path, area_or_address, approx_date, caption")
        .eq("trade_id", createdTradeId)
        .order("created_at", { ascending: true });
      if (data && data.length) {
        setPortfolio(data.map((d: any) => ({
          id: d.id, storage_path: d.storage_path,
          preview_name: d.storage_path.split("/").pop() ?? "photo",
          area_or_address: d.area_or_address ?? "",
          approx_date: d.approx_date ? String(d.approx_date).slice(0, 7) : "",
          caption: d.caption ?? "",
        })));
      }
    })();
  }, [createdTradeId, isTimeServed]);

  const submitStep3 = async () => {
    setError("");
    const hasInsurance = !!existingDocs.insurance;
    const hasId = !!existingDocs.id;
    const hasQual = !!existingDocs.qualification;
    if (uploadingDoc.insurance || uploadingDoc.id || uploadingDoc.qualification || uploadingPortfolio) {
      setError("Hold on — a file is still uploading.");
      return;
    }
    if (!hasInsurance) { setError("Public liability insurance is required"); return; }
    if (!insuranceExpiry) { setError("Insurance expiry date is required"); return; }
    if (insuranceStatus === "expired") { setError("Your insurance has expired"); return; }
    if (!hasId) { setError("Photo ID is required"); return; }

    if (isTimeServed) {
      // Time-served: portfolio + references + years-in-trade required
      if (!yearsExperience || parseInt(yearsExperience, 10) < 2) {
        setError("Time-served route requires at least 2 years in the trade"); return;
      }
      if (portfolio.length < 5) {
        setError("Please upload at least 5 portfolio photos of your own work"); return;
      }
      const validRefs = references.filter(r => r.contact_name.trim() && (r.phone.trim() || r.email.trim()));
      if (validRefs.length < 2) {
        setError("At least 2 references required — name + phone or email"); return;
      }
    } else if (qualMeta.required && !hasQual) {
      setError(`${qualMeta.label} is required for your trade`); return;
    }
    setStep(4);
  };

  // ---- STEP 4: submit for review ----
  const submitFinal = async () => {
    setError("");
    setLoading(true);
    try {
      // Persist references for time-served route (idempotent: wipe + insert)
      if (isTimeServed && createdTradeId) {
        await supabase.from("trade_references").delete().eq("trade_id", createdTradeId);
        const rows = references
          .filter(r => r.contact_name.trim() && (r.phone.trim() || r.email.trim()))
          .map(r => ({
            trade_id: createdTradeId,
            contact_name: r.contact_name.trim(),
            relationship: r.relationship,
            phone: r.phone.trim() || null,
            email: r.email.trim() || null,
          }));
        if (rows.length) await supabase.from("trade_references").insert(rows as any);
      }

      await supabase.from("trades").update({
        verification_status: isTimeServed ? "pending_assessment" : "pending_verification",
        verification_route: chosenRoute || "registered",
        years_in_trade: yearsExperience ? parseInt(yearsExperience, 10) : null,
        submitted_for_review_at: new Date().toISOString(),
      } as any).eq("id", createdTradeId!);

      // Fire confirmation email (best-effort)
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "trade-verification-submitted",
            recipientEmail: email.trim(),
            idempotencyKey: `trade-submitted-${createdTradeId}`,
            templateData: { name: fullName.trim() },
          },
        });
      } catch (e) { console.warn("submitted email failed (non-blocking)", e); }

      // Admin notification — alert team that the trade has submitted for review
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "trade-signup-admin-notification",
            idempotencyKey: `trade-admin-submitted-${createdTradeId}`,
            templateData: {
              name: fullName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              postcode: postcode.trim().toUpperCase(),
              companyName: companyName.trim() || fullName.trim(),
              tradeType,
              stage: "submitted_for_review",
            },
          },
        });
      } catch (e) { console.warn("trade-signup admin (review) notification failed", e); }

      navigate(isTimeServed ? "/signup/trade/assessment-pending" : "/signup/trade/under-review", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  // ---- Out-of-area trade waitlist capture ----
  const submitWaitlist = async () => {
    setError("");
    if (!fullName.trim() || !waitlistTrade.trim() || !email.trim() || !postcode.trim()) {
      setError("Please fill in your name, trade, email and postcode.");
      return;
    }
    setWaitlistSubmitting(true);
    try {
      const { error: insertErr } = await supabase.from("early_signups").insert({
        name: fullName.trim(),
        email: email.trim(),
        postcode: postcode.trim().toUpperCase(),
        user_type: "trade",
        admin_notes: `Trade: ${waitlistTrade.trim()}`,
      } as any);
      if (insertErr) throw insertErr;
      setWaitlistDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  if (checkingExisting) return <SetupRedirectLoader />;

  if (outOfArea) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
        <SEO title="Join the waitlist — ProGrafter" description="We're expanding across the UK. Join the ProGrafter trade waitlist." path="/register/trade" noindex />
        <header className="py-6 px-6">
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-lg">
            {waitlistDone ? (
              <div className="text-center">
                <span className="inline-flex w-14 h-14 rounded-full bg-teal/15 items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-teal" strokeWidth={2} />
                </span>
                <h2 className="font-heading text-cream text-[40px] leading-[1.05] mb-4">
                  You're on the list — <span className="text-teal">we'll be in touch.</span>
                </h2>
                <p className="font-body text-cream/70 text-base mb-8">
                  Thanks {fullName.trim().split(/\s+/)[0] || "there"}. We'll email you the day ProGrafter reaches {postcode.trim().toUpperCase()}.
                </p>
                <Link
                  to="/"
                  className="inline-block bg-teal text-cream font-mono text-sm px-8 py-4 rounded-xl hover:bg-teal-hover transition-colors"
                >
                  Back to home
                </Link>
              </div>
            ) : (
              <>
                <p className="font-mono text-xs text-teal uppercase tracking-widest mb-3">Coming soon</p>
                <h2 className="font-heading text-cream text-[40px] leading-[1.05] mb-5">
                  We're not in your <span className="text-teal">area yet.</span>
                </h2>
                <p className="font-body text-cream/70 text-base mb-8">
                  ProGrafter is live across the East Midlands, Lincolnshire and South Yorkshire (NG, DE, LE, LN, S and DN postcodes) right now. Leave your details and we'll tell you the day we reach you.
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-body">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <label className={labelClass}>Your Trade *</label>
                    <input className={inputClass} value={waitlistTrade} onChange={(e) => setWaitlistTrade(e.target.value)} placeholder="e.g. Electrician, Plumber, Builder" />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.co.uk" autoComplete="email" />
                  </div>
                  <div>
                    <label className={labelClass}>Postcode *</label>
                    <input className={`${inputClass} uppercase`} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="SW1A 1AA" autoComplete="postal-code" />
                  </div>
                </div>

                <button
                  onClick={submitWaitlist}
                  disabled={waitlistSubmitting}
                  className="w-full mt-6 bg-teal text-cream font-mono text-sm py-4 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
                >
                  {waitlistSubmitting ? "Saving…" : "Join the waitlist"}
                </button>
                <p className="mt-4 text-center font-body text-sm text-cream/60">
                  <Link to="/" className="text-teal underline">Back to home</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }


  if (!gatePassed) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
        <SEO title="Before you start — Join ProGrafter" description="What you'll need to apply as a trade on ProGrafter." path="/register/trade" noindex />
        <header className="py-6 px-6">
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-lg">
            <p className="font-mono text-xs text-teal uppercase tracking-widest mb-3">Application checklist</p>
            <h2 className="font-heading text-cream text-[40px] leading-[1.05] mb-3">
              Before you start — <span className="text-teal">have these ready.</span>
            </h2>
            <p className="font-body text-cream/60 text-sm mb-6">
              We verify every trade in 5 steps so homeowners trust who they hire.{" "}
              <a href="/trust" className="text-teal underline underline-offset-2 hover:text-teal-hover">See our Trust Centre →</a>
            </p>
            <ul className="space-y-4 mb-6">
              {[
                { icon: ShieldCheck, title: "Public Liability Insurance certificate", body: "PDF or photo. Must show your business name, policy number, and expiry date." },
                { icon: IdCard, title: "Photo ID", body: "Passport or driving licence" },
                { icon: Award, title: "Trade qualification", body: "NICEIC card, Gas Safe registration, MCS cert, City & Guilds, or relevant qualification for your trade" },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex items-start gap-3 p-4 rounded-xl border border-cream/10 bg-cream/5">
                  <span className="flex-none w-9 h-9 rounded-lg bg-teal/15 flex items-center justify-center">
                    <Check className="w-5 h-5 text-teal" strokeWidth={2.5} />
                  </span>
                  <div className="flex-1">
                    <p className="font-heading text-cream text-base leading-tight mb-1">{title}</p>
                    <p className="font-body text-cream/60 text-sm">{body}</p>
                  </div>
                  <Icon className="hidden sm:block w-5 h-5 text-teal/60 mt-1" strokeWidth={1.5} />
                </li>
              ))}
            </ul>
            <p className="font-body text-cream/70 text-sm mb-6 px-1">
              Uploading takes around 4 minutes. We review within 5–7 days.
            </p>
            <button
              onClick={() => setGatePassed(true)}
              className="w-full bg-teal text-cream font-mono text-sm py-4 rounded-xl hover:bg-teal-hover transition-colors"
            >
              I have these ready — start my application
            </button>
            <p className="mt-4 text-center font-body text-sm text-cream/60">
              Already a member? <Link to="/login" className="text-teal underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <SEO
        title="Join as a Trade — ProGrafter"
        description="Apply to join ProGrafter. Verified, insured tradespeople only. Free to join — 7.5% commission only when a job completes."
        path="/register/trade"
        noindex
        jsonLd={buildServiceJsonLd({
          name: "Trade Registration",
          description: "Free registration for verified UK tradespeople — pay 7.5% only when a job completes.",
          url: "https://prografter.co.uk/register/trade",
          serviceType: "Trade marketplace registration",
          price: "0.00",
        })}
      />
      <header className="py-6 px-6">
        <Logo variant="light" className="h-9 w-auto inline-block" />
      </header>

      <div className="flex-1 flex items-start justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-teal" : "bg-cream/10"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              Step {step} of 4
            </span>
          </div>

          {resuming && step > 1 && (
            <div className="mb-4 p-3 rounded-lg bg-teal/10 border border-teal/30 text-teal text-sm font-body">
              Welcome back — we've picked up where you left off.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-body">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-6">
                Your <span className="text-teal">Account.</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.co.uk" autoComplete="email" />
                </div>
                <div>
                  <label className={labelClass}>Password *</label>
                  <input type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
                </div>
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 900000" autoComplete="tel" />
                </div>
                <div>
                  <label className={labelClass}>Business Postcode *</label>
                  <input className={`${inputClass} uppercase`} value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="NG1 1AA" autoComplete="postal-code" />
                </div>
                <label className="flex items-start gap-3 pt-2 cursor-pointer">
                  <input type="checkbox" checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className={`${checkboxClass} mt-1`} />
                  <span className="font-body text-sm text-cream/80">
                    I agree to the <Link to="/terms" className="text-teal underline">Terms</Link> and <Link to="/privacy" className="text-teal underline">Privacy Policy</Link> *
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className={`${checkboxClass} mt-1`} />
                  <span className="font-body text-sm text-cream/80">
                    Send me product updates and lead notifications
                  </span>
                </label>
              </div>
              <button
                onClick={submitStep1}
                disabled={loading}
                className="w-full mt-8 bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account…" : "Continue → Step 2"}
              </button>
              <p className="mt-4 text-center font-body text-sm text-cream/60">
                Already a member? <Link to="/login" className="text-teal underline">Sign in</Link>
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <div className="flex items-baseline justify-between gap-3 mb-6">
                <h2 className="font-heading text-cream text-[40px] leading-none">
                  Your <span className="text-teal">Business.</span>
                </h2>
                {autosaveState !== "idle" && (
                  <span className="font-mono text-[10px] text-teal/80 uppercase tracking-widest whitespace-nowrap">
                    {autosaveState === "saving" ? "Saving…" : "Saved ✓"}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Trade Type *</label>
                  <select className={inputClass} value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
                    <option value="">Select your trade…</option>
                    <optgroup label="General">
                      {GENERAL_TRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    <optgroup label="Renewable / Green">
                      {RENEWABLE_TRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  </select>
                  {isGreen && (
                    <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-teal">
                      <Leaf className="w-3 h-3" /> Green trade — extra MCS / TrustMark fields appear below
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Company Name *</label>
                  <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Smith Plumbing Ltd" />
                  <p className="mt-1.5 font-body text-xs text-cream/50">
                    Sole trader? Your full name is fine. Ltd company? Use your registered Companies House name.
                  </p>
                </div>

                {/* Company Registration */}
                <div className="p-4 rounded-xl border border-cream/10 space-y-4">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest">Company Registration</p>
                  <div>
                    <label className={labelClass}>Business structure *</label>
                    <div className="space-y-2">
                      {([
                        { v: "sole_trader", label: "Sole trader" },
                        { v: "limited_company", label: "Limited company" },
                        { v: "partnership", label: "Partnership" },
                      ] as const).map((opt) => (
                        <label key={opt.v} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="business_structure"
                            value={opt.v}
                            checked={businessStructure === opt.v}
                            onChange={() => {
                              setBusinessStructure(opt.v);
                              setCompaniesHouseError("");
                              if (opt.v === "sole_trader") setCompaniesHouseNumber("");
                            }}
                            className="w-4 h-4 accent-teal cursor-pointer"
                          />
                          <span className="text-sm text-cream/80">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {businessStructure && businessStructure !== "sole_trader" && (
                    <div>
                      <label className={labelClass}>
                        Companies House number {businessStructure === "limited_company" ? "*" : "(optional)"}
                      </label>
                      <input
                        className={inputClass}
                        value={companiesHouseNumber}
                        onChange={(e) => {
                          setCompaniesHouseNumber(e.target.value.toUpperCase());
                          setCompaniesHouseError("");
                        }}
                        onBlur={() => {
                          const v = normaliseChNumber(companiesHouseNumber);
                          if (v && !COMPANIES_HOUSE_NUMBER.test(v)) {
                            setCompaniesHouseError("Must be 8 digits, or 2 letters + 6 digits (e.g. SC123456)");
                          }
                        }}
                        placeholder="12345678 or SC123456"
                        maxLength={8}
                      />
                      <p className="mt-1.5 font-body text-xs text-cream/50">
                        8 characters — find yours on your certificate of incorporation or at find-and-update.company-information.service.gov.uk
                      </p>
                      {companiesHouseError && (
                        <p className="mt-1.5 font-body text-xs text-red-400">{companiesHouseError}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Years Experience</label>
                    <input type="number" min="0" className={inputClass} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="10" />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input className={inputClass} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Short Bio (Strongly Recommended)</label>
                  <textarea rows={3} className={inputClass} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A few lines about your work…" />
                  <p className="mt-1.5 font-body text-xs text-cream/50">
                    Trades with a bio are significantly more likely to win jobs. Describe your experience, the areas you cover, and what makes your work stand out.
                  </p>
                </div>

                {tradeType && (
                  <div>
                    <label className={labelClass}>Specialisms (optional)</label>
                    <Suspense fallback={<div className="text-cream/60 text-sm font-body py-3">Loading specialisms…</div>}>
                      <SpecialismsPicker
                        tradeType={tradeType}
                        selected={specialismIds}
                        primaryId={primarySpecialismId}
                        onChange={(sel, pid) => { setSpecialismIds(sel); setPrimarySpecialismId(pid); }}
                      />
                    </Suspense>
                  </div>
                )}

                {isGreen && (
                  <div className="space-y-4 p-4 rounded-xl border border-teal/30 bg-teal/5">
                    <p className="font-mono text-xs text-teal uppercase tracking-widest">Green Certifications</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>MCS Number</label>
                        <input className={inputClass} value={mcsNumber} onChange={(e) => setMcsNumber(e.target.value)} placeholder="MCS-12345" />
                      </div>
                      <div>
                        <label className={labelClass}>TrustMark Number</label>
                        <input className={inputClass} value={trustmarkNumber} onChange={(e) => setTrustmarkNumber(e.target.value)} placeholder="TM-67890" />
                      </div>
                    </div>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={pas2030} onChange={(e) => setPas2030(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">PAS 2030 accredited</span></label>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={pas2035} onChange={(e) => setPas2035(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">PAS 2035 coordinator</span></label>
                    {showOzev(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={ozevApproved} onChange={(e) => setOzevApproved(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">OZEV approved</span></label>}
                    {showFgas(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={fgasRegistered} onChange={(e) => setFgasRegistered(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">F-Gas registered</span></label>}
                    {showCiga(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={cigaRegistered} onChange={(e) => setCigaRegistered(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">CIGA registered</span></label>}
                    {showInca(tradeType) && <label className="flex items-center gap-3"><input type="checkbox" checked={incaCertified} onChange={(e) => setIncaCertified(e.target.checked)} className={checkboxClass} /><span className="text-sm text-cream/80">INCA certified</span></label>}
                    <div>
                      <label className={labelClass}>Cert Expiry</label>
                      <Suspense fallback={null}>
                        <TradeDateField value={greenCertExpiry} onChange={setGreenCertExpiry} placeholder="Select expiry date" inputClassName={inputClass} />
                      </Suspense>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
                <button onClick={submitStep2} disabled={loading} className="flex-[2] bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  {loading ? "Saving…" : "Continue → Step 3"}
                </button>
              </div>
            </div>
          )}

          {/* ROUTE CHOICE — Band 3 only */}
          {showRouteChoice && bandConfig.band === "competence_assessed" && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-3">
                How will you <span className="text-teal">prove it?</span>
              </h2>
              <p className="font-body text-cream/60 text-sm mb-6">
                {tradeType} isn't legally gated. Pick the route that matches your background — both lead to the same verified badge.
              </p>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => { setChosenRoute("qualified"); setShowRouteChoice(false); setStep(3); }}
                  className="w-full text-left p-5 rounded-xl border border-cream/15 hover:border-teal bg-cream/5 transition-colors"
                >
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-2">Route A — Qualified</p>
                  <p className="font-heading text-cream text-lg mb-1">I hold a trade qualification</p>
                  <p className="font-body text-cream/60 text-sm">
                    NVQ / City &amp; Guilds / apprenticeship certificate. Upload it as your trade qualification.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => { setChosenRoute("time_served"); setShowRouteChoice(false); setStep(3); }}
                  className="w-full text-left p-5 rounded-xl border border-cream/15 hover:border-teal bg-cream/5 transition-colors"
                >
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-2">Route B — Time-Served</p>
                  <p className="font-heading text-cream text-lg mb-1">I've earned it on the tools</p>
                  <p className="font-body text-cream/60 text-sm">
                    No formal qualification — proven by 2+ years in the trade, a portfolio of at least 5 photos of your own work, 2 references we phone, plus a short competence interview.
                  </p>
                </button>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setShowRouteChoice(false); setStep(2); }} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && !showRouteChoice && (
            <div>
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="font-heading text-cream text-[40px] leading-none">
                  Your <span className="text-teal">documents.</span>
                </h2>
                {docAutosave !== "idle" && (
                  <span className="font-mono text-[10px] text-teal/80 uppercase tracking-widest whitespace-nowrap">
                    {docAutosave === "saving" ? "Saving…" : "Saved ✓"}
                  </span>
                )}
              </div>
              <p className="font-body text-cream/60 text-sm mb-6">
                Each document is saved automatically as you upload. Files are stored privately and only seen by our verification team. Max 10MB per file.
              </p>

              <div className="space-y-6">
                {/* Insurance */}
                <div className="p-4 rounded-xl border border-cream/10">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-1">Public Liability Insurance certificate *</p>
                  <p className="text-xs text-cream/60 font-body mb-2">Must show your business name, policy number, and expiry date. PDF, JPG or PNG.</p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFile(setInsuranceFile, "insurance", () => insuranceExpiry)}
                    className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {uploadingDoc.insurance
                    ? <p className="mt-2 text-xs text-teal font-body">Uploading {insuranceFile?.name}…</p>
                    : insuranceFile
                      ? <p className="mt-2 text-xs text-cream/60 font-body">✓ {insuranceFile.name} saved</p>
                      : existingDocs.insurance && <p className="mt-2 text-xs text-teal font-body">✓ Already uploaded: {existingDocs.insurance.name} (re-upload to replace)</p>}


                  <div className="mt-3">
                    <label className={labelClass}>Certificate expiry date *</label>
                    <Suspense fallback={null}>
                      <TradeDateField value={insuranceExpiry} onChange={(d) => { setInsuranceExpiry(d); setDocsConfirmed(false); }} placeholder="Select expiry date" inputClassName={inputClass} />
                    </Suspense>
                    {insuranceStatus === "expired" && <p className="mt-1 text-xs text-red-400">⚠ Insurance has expired</p>}
                    {insuranceStatus === "expiring" && <p className="mt-1 text-xs text-yellow-400">⚠ Expires within 30 days</p>}
                  </div>
                </div>

                {/* ID */}
                <div className="p-4 rounded-xl border border-cream/10">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-1">Photo ID *</p>
                  <p className="text-xs text-cream/60 font-body mb-2">Passport or driving licence. Must be the ID of the person registering this account. JPG, PNG or PDF.</p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFile(setIdFile, "id")}
                    className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {uploadingDoc.id
                    ? <p className="mt-2 text-xs text-teal font-body">Uploading {idFile?.name}…</p>
                    : idFile
                      ? <p className="mt-2 text-xs text-cream/60 font-body">✓ {idFile.name} saved</p>
                      : existingDocs.id && <p className="mt-2 text-xs text-teal font-body">✓ Already uploaded: {existingDocs.id.name} (re-upload to replace)</p>}


                </div>

                {/* Qualification — dynamic per trade type */}
                <div className="p-4 rounded-xl border border-cream/10">
                  <p className="font-mono text-xs text-teal uppercase tracking-widest mb-1">
                    {qualMeta.label} {qualMeta.required ? "*" : "(strongly preferred)"}
                  </p>
                  <p className="text-xs text-cream/60 font-body mb-2">{qualMeta.helper}. PDF, JPG or PNG.</p>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    onChange={handleFile(setQualFile, "qualification", () => qualExpiry)}
                    className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                  />
                  {uploadingDoc.qualification
                    ? <p className="mt-2 text-xs text-teal font-body">Uploading {qualFile?.name}…</p>
                    : qualFile
                      ? <p className="mt-2 text-xs text-cream/60 font-body">✓ {qualFile.name} saved</p>
                      : existingDocs.qualification && <p className="mt-2 text-xs text-teal font-body">✓ Already uploaded: {existingDocs.qualification.name} (re-upload to replace)</p>}


                  <div className="mt-3">
                    <label className={labelClass}>Expiry date (if applicable)</label>
                    <Suspense fallback={null}>
                      <TradeDateField value={qualExpiry} onChange={(d) => { setQualExpiry(d); setDocsConfirmed(false); }} placeholder="Select expiry date" inputClassName={inputClass} />
                    </Suspense>
                  </div>
                </div>

                {/* Time-served: portfolio + references */}
                {isTimeServed && (
                  <>
                    <div className="p-4 rounded-xl border border-teal/30 bg-teal/5 space-y-3">
                      <p className="font-mono text-xs text-teal uppercase tracking-widest">Portfolio of your work *</p>
                      <p className="text-xs text-cream/60 font-body">
                        At least 5 photos of jobs you've delivered yourself. Add an area/postcode + approx. month for each so we can spot-check.
                      </p>
                      <input
                        type="file" multiple accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => e.target.files && uploadPortfolioFiles(e.target.files)}
                        className="text-cream text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal file:text-cream file:font-mono file:text-xs file:cursor-pointer"
                      />
                      {uploadingPortfolio && <p className="text-xs text-teal font-body">Uploading…</p>}
                      <p className="text-xs text-cream/60 font-body">{portfolio.length} / 5+ photos</p>
                      <div className="space-y-3">
                        {portfolio.map((p, i) => (
                          <div key={i} className="p-3 rounded-lg border border-cream/10 bg-cream/5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-cream/70 font-body truncate">📷 {p.preview_name}</p>
                              <button type="button" onClick={() => removePortfolio(i)} className="text-xs text-red-400 hover:underline">Remove</button>
                            </div>
                            <input className={inputClass} placeholder="Area / postcode (e.g. SW11)" value={p.area_or_address} onChange={(e) => updatePortfolio(i, { area_or_address: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="month" className={inputClass} value={p.approx_date} onChange={(e) => updatePortfolio(i, { approx_date: e.target.value })} />
                              <input className={inputClass} placeholder="Caption (optional)" value={p.caption} onChange={(e) => updatePortfolio(i, { caption: e.target.value })} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-teal/30 bg-teal/5 space-y-3">
                      <p className="font-mono text-xs text-teal uppercase tracking-widest">References — we phone these *</p>
                      <p className="text-xs text-cream/60 font-body">At least 2. Name + phone or email per reference.</p>
                      {references.map((r, i) => (
                        <div key={i} className="p-3 rounded-lg border border-cream/10 bg-cream/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] text-teal uppercase">Reference {i + 1}</p>
                            {references.length > 2 && (
                              <button type="button" onClick={() => setReferences(rs => rs.filter((_, k) => k !== i))} className="text-xs text-red-400 hover:underline">Remove</button>
                            )}
                          </div>
                          <input className={inputClass} placeholder="Contact name" value={r.contact_name} onChange={(e) => setReferences(rs => rs.map((x, k) => k === i ? { ...x, contact_name: e.target.value } : x))} />
                          <select className={inputClass} value={r.relationship} onChange={(e) => setReferences(rs => rs.map((x, k) => k === i ? { ...x, relationship: e.target.value as any } : x))}>
                            <option value="past_customer">Past customer</option>
                            <option value="trade_contact">Trade contact</option>
                            <option value="supplier">Supplier</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="grid grid-cols-2 gap-2">
                            <input className={inputClass} placeholder="Phone" value={r.phone} onChange={(e) => setReferences(rs => rs.map((x, k) => k === i ? { ...x, phone: e.target.value } : x))} />
                            <input className={inputClass} placeholder="Email" value={r.email} onChange={(e) => setReferences(rs => rs.map((x, k) => k === i ? { ...x, email: e.target.value } : x))} />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => setReferences(rs => [...rs, blankRef()])} className="text-sm text-teal hover:underline">+ Add another reference</button>
                    </div>
                  </>
                )}

                {docsConfirmed && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-teal/10 border border-teal/40">
                    <CheckCircle2 className="w-5 h-5 text-teal flex-none mt-0.5" strokeWidth={2} />
                    <p className="font-body text-cream text-sm">
                      <span className="font-mono text-teal uppercase tracking-widest text-xs block mb-1">Documents received</span>
                      You're nearly done — tap continue to review and submit.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
                <button onClick={submitStep3} disabled={loading} className="flex-[2] bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  {loading ? "Saving…" : "Continue → Review"}
                </button>
              </div>
            </div>
          )}


          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 className="font-heading text-cream text-[40px] leading-none mb-3">
                Review &amp; <span className="text-teal">Submit.</span>
              </h2>
              <p className="font-body text-cream/60 text-sm mb-6">
                Check your details. Once submitted, our team will verify within 1 business day.
              </p>
              <div className="space-y-4 text-sm font-body text-cream/80">
                <SummaryRow label="Name" value={fullName} onEdit={() => setStep(1)} />
                <SummaryRow label="Email" value={email} />
                <SummaryRow label="Phone" value={phone} />
                <SummaryRow label="Postcode" value={postcode.toUpperCase()} />
                <SummaryRow label="Trade" value={tradeType} onEdit={() => setStep(2)} />
                <SummaryRow label="Company" value={companyName} />
                {yearsExperience && <SummaryRow label="Experience" value={`${yearsExperience} years`} />}
                {website && <SummaryRow label="Website" value={website} />}
                {isGreen && (
                  <>
                    {mcsNumber && <SummaryRow label="MCS" value={mcsNumber} />}
                    {trustmarkNumber && <SummaryRow label="TrustMark" value={trustmarkNumber} />}
                  </>
                )}
                <SummaryRow label="Insurance" value={insuranceFile?.name ?? existingDocs.insurance?.name ?? "—"} onEdit={() => setStep(3)} />
                <SummaryRow label="Insurance expires" value={insuranceExpiry ? format(insuranceExpiry, "d MMM yyyy") : "—"} />
                <SummaryRow label="ID" value={idFile?.name ?? existingDocs.id?.name ?? "—"} />
                <SummaryRow label="Qualification" value={qualFile?.name ?? existingDocs.qualification?.name ?? "Not provided"} />

              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(3)} className="flex-1 border border-cream/20 text-cream/80 font-mono text-sm py-3 rounded-xl hover:bg-cream/5 transition-colors">← Back</button>
                <button onClick={submitFinal} disabled={loading} className="flex-[2] bg-teal text-cream font-mono text-sm py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50">
                  {loading ? "Submitting…" : "Submit for Review"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <TradeVerificationExplainer />
    </div>
  );
};

const SummaryRow = ({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-cream/10">
    <div className="flex-1 min-w-0">
      <p className="font-mono text-[10px] text-teal uppercase tracking-widest mb-0.5">{label}</p>
      <p className="truncate text-cream">{value || "—"}</p>
    </div>
    {onEdit && (
      <button onClick={onEdit} className="font-mono text-xs text-teal hover:underline">Edit</button>
    )}
  </div>
);

export default SignupTrade;
