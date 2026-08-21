import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Plus, Trash2, Send, AlertTriangle,
  CheckCircle2, FileText, Package, ShieldCheck, PoundSterling, Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAtlasQuoteHandoff, ATLAS_HANDOFF_HEADING } from "@/lib/atlasQuoteHandoff";
import {
  loadQuickBuildPrefill, readQuickBuildHandoff, buildPrefillFromOutput,
  type QuickBuildPrefill,
} from "@/lib/quickBuildPrefill";
import MaterialsBreakdown, { emptyMaterialLine, type MaterialLine } from "@/components/trade/MaterialsBreakdown";
import { checkQuoteQuality, hasCriticalIssues, type QuoteIssue } from "@/lib/quoteQuality";

/* ------------------------------------------------------------------ */
/* Types + constants                                                    */
/* ------------------------------------------------------------------ */

interface PaymentStage {
  name: string;
  description: string;
  amount: string;
  trigger: string;
}
const emptyStage = (): PaymentStage => ({ name: "", description: "", amount: "", trigger: "" });

const TIER_HINTS = {
  budget: "e.g. Standard range materials, functional finish, fully Building Regulations compliant",
  standard: "e.g. Mid-range materials, quality finish, manufacturer warranties included",
  premium: "e.g. Premium branded materials, superior finish, extended warranties",
};

const CERT_QUESTIONS: { key: string; label: string }[] = [
  { key: "building_control", label: "Building Control involved?" },
  { key: "electrical_cert", label: "Electrical certificate included?" },
  { key: "gas_safe", label: "Gas Safe certificate included?" },
  { key: "fensa", label: "FENSA / CERTASS certificate included?" },
  { key: "mcs", label: "MCS certificate included?" },
  { key: "waste", label: "Waste transfer note included?" },
  { key: "warranty", label: "Warranty included?" },
  { key: "ibg", label: "Insurance-backed guarantee included?" },
  { key: "product_guarantees", label: "Product guarantees included?" },
  { key: "handover_pack", label: "Completion / handover pack included?" },
];
const CERT_OPTIONS = ["Included", "Not included", "Not applicable", "To be confirmed"];

const STEPS = [
  { id: 0, title: "Summary & Scope", blurb: "The basics the homeowner reads first", icon: FileText },
  { id: 1, title: "Materials & Pricing", blurb: "Line items, allowances, tier options", icon: Package },
  { id: 2, title: "Certifications & Terms", blurb: "Compliance, warranties, how you work", icon: ShieldCheck },
  { id: 3, title: "Payment & Review", blurb: "Stage payments, final check, submit", icon: PoundSterling },
];

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
    .format(Number.isFinite(n) ? n : 0);

const labelCls = "font-sans text-[13px] font-medium text-navy-deep/70 block mb-1.5";
const fieldCls = "font-mono bg-white border-navy/15 focus-visible:ring-teal";

/* ------------------------------------------------------------------ */

const QuoteBuilder = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backTo = searchParams.get("from") || `/project/${jobId}`;

  const [step, setStep] = useState(0);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<{ title: string | null; job_type: string | null; address: string | null; postcode: string | null; homeowner_id: string | null } | null>(null);
  const [homeownerName, setHomeownerName] = useState<string>("");
  const [tradeName, setTradeName] = useState<string>("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);

  // Stage 1
  const [amount, setAmount] = useState("");
  const [vatStatus, setVatStatus] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [message, setMessage] = useState("");

  // Stage 2
  const [tierEnabled, setTierEnabled] = useState(false);
  const [budgetPrice, setBudgetPrice] = useState("");
  const [budgetDesc, setBudgetDesc] = useState("");
  const [standardPrice, setStandardPrice] = useState("");
  const [standardDesc, setStandardDesc] = useState("");
  const [premiumPrice, setPremiumPrice] = useState("");
  const [premiumDesc, setPremiumDesc] = useState("");
  const [materials, setMaterials] = useState<MaterialLine[]>([emptyMaterialLine()]);
  const [shareMaterials, setShareMaterials] = useState(false);

  // Stage 3
  const [exclusions, setExclusions] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [provisionalSums, setProvisionalSums] = useState("");
  const [certs, setCerts] = useState<Record<string, string>>({});
  const [workingHours, setWorkingHours] = useState("");
  const [variationProcess, setVariationProcess] = useState("");
  const [homeownerResponsibilities, setHomeownerResponsibilities] = useState("");
  const [cancellationTerms, setCancellationTerms] = useState("");

  // Stage 4
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateIssues, setGateIssues] = useState<QuoteIssue[]>([]);

  const draftKey = `pg_quote_draft_${jobId}`;
  const hydrated = useRef(false);

  /* ---------------- load job + trade ---------------- */
  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      const [jobRes, tradeRes] = await Promise.all([
        supabase.from("jobs").select("title, job_type, address, postcode, homeowner_id").eq("id", jobId!).maybeSingle(),
        uid
          ? supabase.from("trades").select("id, name, company_name").eq("user_id", uid).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      setTradeId((tradeRes.data as any)?.id ?? null);
      setJob(jobRes.data as any);
      setTradeName((tradeRes.data as any)?.company_name || (tradeRes.data as any)?.name || "Your business");
      const hid = (jobRes.data as any)?.homeowner_id;
      if (hid) {
        const { data: ho } = await supabase.from("homeowners").select("name").eq("id", hid).maybeSingle();
        setHomeownerName((ho as any)?.name || "Homeowner");
      }
      setLoading(false);
    };
    if (jobId) load();
  }, [jobId]);

  /* ---------------- draft hydrate + autosave ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        setAmount(d.amount ?? ""); setVatStatus(d.vatStatus ?? ""); setVatAmount(d.vatAmount ?? "");
        setValidUntil(d.validUntil ?? ""); setStartDate(d.startDate ?? ""); setDuration(d.duration ?? "");
        setDepositRequired(!!d.depositRequired); setDepositAmount(d.depositAmount ?? "");
        setMessage(d.message ?? ""); setTierEnabled(!!d.tierEnabled);
        setBudgetPrice(d.budgetPrice ?? ""); setBudgetDesc(d.budgetDesc ?? "");
        setStandardPrice(d.standardPrice ?? ""); setStandardDesc(d.standardDesc ?? "");
        setPremiumPrice(d.premiumPrice ?? ""); setPremiumDesc(d.premiumDesc ?? "");
        if (Array.isArray(d.materials) && d.materials.length) setMaterials(d.materials);
        setShareMaterials(!!d.shareMaterials);
        setExclusions(d.exclusions ?? ""); setAssumptions(d.assumptions ?? "");
        setProvisionalSums(d.provisionalSums ?? "");
        setCerts(d.certs ?? {}); setWorkingHours(d.workingHours ?? "");
        setVariationProcess(d.variationProcess ?? "");
        setHomeownerResponsibilities(d.homeownerResponsibilities ?? "");
        setCancellationTerms(d.cancellationTerms ?? "");
        if (Array.isArray(d.stages)) setStages(d.stages);
        if (d.savedAt) setSavedAt(d.savedAt);
      }
    } catch { /* ignore corrupt draft */ }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  /* --------- QuickBuild AI draft hand-off into the wizard --------- */
  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    const apply = (p: QuickBuildPrefill) => {
      if (!alive) return;
      setAmount((prev) => prev || p.amount);
      setMessage((prev) => (prev.trim() ? prev : p.message));
      setDuration((prev) => prev || p.duration);
      setAssumptions((prev) =>
        prev.includes("QuickBuild") || !p.assumptions
          ? prev
          : (prev.trim() ? `${prev.trim()}\n\n` : "") + p.assumptions,
      );
      if (p.materials.length) {
        setMaterials((prev) => {
          const filled = prev.filter((m) => m.description.trim());
          return filled.length ? prev : p.materials;
        });
      }
      toast.success("QuickBuild draft loaded — review and adjust before submitting.");
    };

    const run = async () => {
      const qbDraft = searchParams.get("qbDraft");
      if (qbDraft) {
        const p = await loadQuickBuildPrefill(qbDraft);
        if (p) { apply(p); return; }
      }
      const handoff = readQuickBuildHandoff();
      if (handoff) apply(buildPrefillFromOutput(handoff.final, handoff.generationId));
    };
    // run after local-draft hydration so it can layer on top
    const t = setTimeout(() => { void run(); }, 0);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  /* --------- Atlas site-survey risk hand-off into assumptions --------- */
  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    getAtlasQuoteHandoff(jobId)
      .then((handoff) => {
        if (!alive || !handoff) return;
        const merge = (prev: string, text: string) =>
          prev.includes(ATLAS_HANDOFF_HEADING) ? prev : (prev.trim() ? `${prev.trim()}\n\n` : "") + text;
        setAssumptions((prev) => merge(prev, handoff.assumptions));
        setProvisionalSums((prev) => merge(prev, handoff.provisionalSums));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [jobId]);

  const draft = {
    amount, vatStatus, vatAmount, validUntil, startDate, duration, depositRequired, depositAmount,
    message, tierEnabled, budgetPrice, budgetDesc, standardPrice, standardDesc, premiumPrice,
    premiumDesc, materials, shareMaterials, exclusions, assumptions, provisionalSums, certs, workingHours,
    variationProcess, homeownerResponsibilities, cancellationTerms, stages,
  };
  const draftJson = JSON.stringify(draft);

  useEffect(() => {
    if (!hydrated.current || !jobId) return;
    const t = setTimeout(() => {
      const now = new Date();
      try {
        localStorage.setItem(draftKey, JSON.stringify({ ...JSON.parse(draftJson), savedAt: now.toISOString() }));
        setSavedAt(now.toISOString());
      } catch { /* quota */ }
    }, 900);
    return () => clearTimeout(t);
  }, [draftJson, draftKey, jobId]);

  /* ---------------- derived ---------------- */
  const totalAmount = tierEnabled ? Number(standardPrice) : Number(amount);
  const certsAnswered = useMemo(() => CERT_QUESTIONS.some((q) => certs[q.key]), [certs]);
  const stagesTotal = stages.reduce((s, st) => s + (Number(st.amount) || 0), 0);
  const materialsTotal = materials.reduce(
    (s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_price_ex_vat) || 0), 0,
  );

  const stepComplete = (i: number) => {
    if (i === 0) return !!(totalAmount > 0 && vatStatus && message.trim().length >= 40 && validUntil);
    if (i === 1) return tierEnabled
      ? !!(budgetPrice && standardPrice && premiumPrice)
      : materials.some((m) => m.description.trim() && m.quantity && m.unit_price_ex_vat) || totalAmount > 0;
    if (i === 2) return !!(exclusions.trim() && assumptions.trim() && certsAnswered);
    if (i === 3) return stages.length > 0;
    return false;
  };
  const completion = Math.round(
    ([0, 1, 2, 3].filter(stepComplete).length / 4) * 100,
  );

  const buildIssues = (): QuoteIssue[] =>
    checkQuoteQuality({
      totalAmount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : null,
      vatStatus: vatStatus || null,
      scopeOfWorks: message || null,
      exclusions: exclusions || null,
      assumptions: assumptions || null,
      paymentSchedule: stages.map((s) => ({ amount: Number(s.amount) || 0 })),
      estimatedStartDate: startDate || null,
      estimatedDuration: duration || null,
      validUntil: validUntil || null,
      depositRequired,
      depositAmount: depositAmount ? Number(depositAmount) : null,
      certificationsAnswered: certsAnswered,
    });

  /* ---------------- submit (unchanged data contract) ---------------- */
  const persistQuote = async () => {
    if (!tradeId || !jobId) return;
    setSubmitting(true);
    const filledMaterials = materials.filter((m) => m.description.trim() || m.quantity || m.unit_price_ex_vat);
    for (const m of filledMaterials) {
      if (m.description.trim().length < 3) { toast.error("Each material line needs a description (min 3 characters)"); setSubmitting(false); return; }
      const qty = parseFloat(m.quantity);
      if (!Number.isFinite(qty) || qty <= 0) { toast.error("Material quantity must be a positive number"); setSubmitting(false); return; }
      const price = parseFloat(m.unit_price_ex_vat);
      if (!Number.isFinite(price) || price < 0) { toast.error("Material unit price must be 0 or greater"); setSubmitting(false); return; }
    }

    const baseAmount = totalAmount;
    const paymentSchedule = stages
      .filter((s) => s.name.trim() || s.amount)
      .map((s, i) => ({
        order: i + 1,
        name: s.name.trim(),
        description: s.description.trim() || null,
        amount: Number(s.amount) || 0,
        percentage: baseAmount ? Math.round(((Number(s.amount) || 0) / baseAmount) * 100) : null,
        trigger: s.trigger.trim() || null,
      }));

    const insertData: any = {
      job_id: jobId,
      trade_id: tradeId,
      amount: baseAmount,
      message: message.trim(),
      scope_of_works: message.trim() || null,
      exclusions: exclusions.trim() || null,
      assumptions: assumptions.trim() || null,
      provisional_sums: provisionalSums.trim() || null,
      vat_status: vatStatus || null,
      vat_amount: vatAmount ? Number(vatAmount) : null,
      valid_until: validUntil || null,
      estimated_start_date: startDate || null,
      estimated_duration_text: duration.trim() || null,
      deposit_required: depositRequired,
      deposit_amount: depositAmount ? Number(depositAmount) : null,
      payment_schedule: paymentSchedule.length ? paymentSchedule : null,
      certifications: certsAnswered ? certs : null,
      terms: {
        working_hours: workingHours.trim() || null,
        variation_process: variationProcess.trim() || null,
        homeowner_responsibilities: homeownerResponsibilities.trim() || null,
        cancellation_terms: cancellationTerms.trim() || null,
        valid_until: validUntil || null,
      },
      tier_enabled: tierEnabled,
      share_materials_with_homeowner: shareMaterials,
    };
    if (tierEnabled) {
      insertData.budget_price = Number(budgetPrice);
      insertData.budget_description = budgetDesc.trim() || null;
      insertData.standard_price = Number(standardPrice);
      insertData.standard_description = standardDesc.trim() || null;
      insertData.premium_price = Number(premiumPrice);
      insertData.premium_description = premiumDesc.trim() || null;
    }

    const { data: quoteRow, error } = await supabase.from("quotes").insert(insertData).select("id, reference").single();
    if (error || !quoteRow) { toast.error("Failed to submit quote"); setSubmitting(false); return; }

    if (filledMaterials.length > 0) {
      const rows = filledMaterials.map((m) => ({
        quote_id: quoteRow.id,
        description: m.description.trim(),
        brand: m.brand.trim() || null,
        model_or_spec: m.model_or_spec.trim() || null,
        quantity: Number(m.quantity),
        unit: m.unit,
        unit_price_ex_vat: Number(m.unit_price_ex_vat),
        vat_rate_pct: Number(m.vat_rate_pct) || 20,
        category: m.category || null,
        merchant_hint: m.merchant_hint?.trim() || null,
      }));
      const { error: matErr } = await supabase.from("quote_materials").insert(rows);
      if (matErr) { toast.error("Quote saved, but materials failed to save"); console.error(matErr); }
    }

    try {
      await supabase
        .from("job_trade_invitations")
        .update({ status: "quote_submitted", quote_submitted_at: new Date().toISOString(), responded_at: new Date().toISOString() })
        .eq("job_id", jobId).eq("trade_id", tradeId);
    } catch { /* non-blocking */ }

    try {
      if (job?.homeowner_id) {
        const { data: ownerRow } = await supabase.from("homeowners").select("email, name").eq("id", job.homeowner_id).maybeSingle();
        const projectTitle = job.title || job.job_type || "your project";
        const projectAddress = [job.address, job.postcode].filter(Boolean).join(", ");
        if ((ownerRow as any)?.email) {
          void supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "quote-received",
              recipientEmail: (ownerRow as any).email,
              idempotencyKey: `quote-received-${quoteRow.id}`,
              templateData: {
                firstName: (ownerRow as any).name?.split(" ")[0] || undefined,
                tradeName,
                amount: `£${baseAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
                projectTitle, projectAddress: projectAddress || undefined, jobId,
              },
            },
          });
        }
        void supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "new-quote-admin",
            recipientEmail: "hello@prografter.co.uk",
            idempotencyKey: `new-quote-admin-${quoteRow.id}`,
            templateData: {
              reference: (quoteRow as any).reference || quoteRow.id,
              projectTitle: job.title || job.job_type || "a project",
              amount: `£${baseAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
              tradeName,
              homeownerName: homeownerName || undefined,
              adminUrl: "https://prografter.co.uk/admin/job-briefs",
            },
          },
        });
      }
    } catch (e) {
      console.warn("quote-received email dispatch failed (non-blocking)", e);
    }

    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    toast.success("Quote submitted successfully");
    setGateOpen(false);
    setSubmitting(false);
    navigate(backTo);
  };

  const critical = hasCriticalIssues(gateIssues);

  /* ---------------- preview ---------------- */
  const PreviewBlock = ({ title, filled, children }: { title: string; filled: boolean; children?: React.ReactNode }) => (
    <div className="border-b border-navy/10 py-4 last:border-0">
      <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-navy/45 mb-1.5">{title}</p>
      {filled ? (
        <div className="font-sans text-[13px] text-navy-deep leading-relaxed whitespace-pre-wrap">{children}</div>
      ) : (
        <div className="space-y-1.5" aria-hidden>
          <div className="h-2.5 rounded bg-navy/10 w-4/5" />
          <div className="h-2.5 rounded bg-navy/10 w-3/5" />
          <p className="font-sans text-[11px] text-navy/35 pt-1">Not yet completed</p>
        </div>
      )}
    </div>
  );

  const Preview = () => (
    <div className="bg-white rounded-2xl border border-navy/10 shadow-[0_8px_30px_-16px_rgba(15,34,56,0.35)] overflow-hidden">
      <div className="bg-navy-deep px-5 py-4">
        <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-teal">Homeowner preview</p>
        <h3 className="font-heading text-white text-2xl leading-tight mt-1">
          {job?.title || job?.job_type || "Your project"}
        </h3>
        <p className="font-sans text-[12px] text-white/60 mt-0.5">Quote from {tradeName}</p>
      </div>

      <div className="px-5 py-4 bg-cream/60 border-b border-navy/10 flex items-end justify-between gap-4">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-navy/45">Total</p>
          <p className="font-mono text-3xl text-navy-deep leading-none mt-1">
            {totalAmount > 0 ? gbp(totalAmount) : "—"}
          </p>
          <p className="font-sans text-[11px] text-navy/50 mt-1">
            {vatStatus === "inclusive" ? "Includes VAT"
              : vatStatus === "exclusive" ? "Excludes VAT"
              : vatStatus === "not_registered" ? "Not VAT registered"
              : "VAT status not stated"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-navy/45">Complete</p>
          <p className="font-mono text-xl text-teal">{completion}%</p>
        </div>
      </div>

      <div className="px-5">
        <PreviewBlock title="Scope of works" filled={message.trim().length > 0}>{message}</PreviewBlock>
        <PreviewBlock title="Timing" filled={!!(startDate || duration || validUntil)}>
          <div className="space-y-0.5 font-mono text-[12px]">
            {startDate && <div>Start: {new Date(startDate).toLocaleDateString("en-GB")}</div>}
            {duration && <div>Duration: {duration}</div>}
            {validUntil && <div>Valid until: {new Date(validUntil).toLocaleDateString("en-GB")}</div>}
          </div>
        </PreviewBlock>
        {tierEnabled && (
          <PreviewBlock title="Options" filled={!!(budgetPrice || standardPrice || premiumPrice)}>
            <div className="font-mono text-[12px] space-y-0.5">
              <div>Budget: {budgetPrice ? gbp(Number(budgetPrice)) : "—"}</div>
              <div className="text-teal-deep">Standard: {standardPrice ? gbp(Number(standardPrice)) : "—"}</div>
              <div>Premium: {premiumPrice ? gbp(Number(premiumPrice)) : "—"}</div>
            </div>
          </PreviewBlock>
        )}
        {shareMaterials && (
          <PreviewBlock title="Materials allowance" filled={materialsTotal > 0}>
            <span className="font-mono text-[13px]">{gbp(materialsTotal)} ex VAT</span>
          </PreviewBlock>
        )}
        <PreviewBlock title="Exclusions" filled={exclusions.trim().length > 0}>{exclusions}</PreviewBlock>
        <PreviewBlock title="Assumptions" filled={assumptions.trim().length > 0}>{assumptions}</PreviewBlock>
        <PreviewBlock title="Provisional sums" filled={provisionalSums.trim().length > 0}>{provisionalSums}</PreviewBlock>
        <PreviewBlock title="Certificates & warranties" filled={certsAnswered}>
          <div className="space-y-0.5">
            {CERT_QUESTIONS.filter((q) => certs[q.key]).map((q) => (
              <div key={q.key} className="flex justify-between gap-3 font-sans text-[12px]">
                <span className="text-navy/70">{q.label.replace("?", "")}</span>
                <span className="font-mono text-[12px] text-navy-deep">{certs[q.key]}</span>
              </div>
            ))}
          </div>
        </PreviewBlock>
        <PreviewBlock title="Payment schedule" filled={stages.length > 0}>
          <div className="space-y-1">
            {stages.map((s, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span className="font-sans text-[12px] text-navy/70">{s.name || `Stage ${i + 1}`}</span>
                <span className="font-mono text-[12px]">{s.amount ? gbp(Number(s.amount)) : "—"}</span>
              </div>
            ))}
          </div>
        </PreviewBlock>
        <PreviewBlock title="How we work" filled={!!(workingHours || variationProcess || cancellationTerms)}>
          <div className="space-y-1 font-sans text-[12px]">
            {workingHours && <div>Hours: <span className="font-mono">{workingHours}</span></div>}
            {variationProcess && <div>Variations: {variationProcess}</div>}
            {cancellationTerms && <div>Cancellation: {cancellationTerms}</div>}
          </div>
        </PreviewBlock>
      </div>
    </div>
  );

  /* ---------------- stage panes ---------------- */
  const StageHeading = ({ i }: { i: number }) => (
    <div className="mb-6">
      <p className="font-mono text-[12px] text-teal-deep">Stage {i + 1} of 4</p>
      <h2 className="font-heading text-navy-deep text-4xl leading-none mt-1">{STEPS[i].title}</h2>
      <p className="font-sans text-sm text-navy/55 mt-2">{STEPS[i].blurb}</p>
    </div>
  );

  const card = "bg-white rounded-2xl border border-navy/10 p-5 sm:p-6 space-y-4 shadow-[0_2px_10px_-6px_rgba(15,34,56,0.25)]";

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="font-mono text-sm text-navy/60">Loading quote builder…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-deep border-b border-white/10">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-2 font-sans text-[13px] text-white/70 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to job</span>
          </button>
          <div className="h-6 w-px bg-white/15 hidden sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-white text-xl sm:text-2xl leading-none truncate">
              {job?.title || job?.job_type || "Quote"}
            </h1>
            <p className="font-sans text-[12px] text-white/55 truncate">
              {tradeName} <span className="text-white/25 mx-1">·</span> for {homeownerName || "homeowner"}
            </p>
          </div>
          <button
            onClick={() => setMobilePreview((v) => !v)}
            className="xl:hidden flex items-center gap-1.5 font-sans text-[12px] text-navy-deep bg-teal px-3 py-2 rounded-lg"
          >
            <Eye className="w-4 h-4" /> {mobilePreview ? "Form" : "Preview"}
          </button>
        </div>
      </header>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-10 grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        {/* Step rail */}
        <aside className="xl:col-span-3">
          <div className="xl:sticky xl:top-24 space-y-3">
            <div className="hidden xl:block">
              <p className="font-sans text-[11px] uppercase tracking-[0.16em] text-navy/45 mb-3">Your quote</p>
            </div>
            <div className="flex xl:block gap-2 overflow-x-auto pb-1 xl:pb-0 xl:space-y-2">
              {STEPS.map((s, i) => {
                const active = step === i;
                const done = stepComplete(i);
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`shrink-0 xl:w-full text-left rounded-xl px-4 py-3 border transition-colors flex items-center gap-3 ${
                      active
                        ? "bg-navy text-white border-navy"
                        : "bg-white text-navy-deep border-navy/10 hover:border-teal/50"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-mono text-[12px] shrink-0 ${
                        done ? "bg-teal text-navy-deep" : active ? "bg-white/15 text-white" : "bg-navy/5 text-navy/50"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-sans text-[13px] font-medium whitespace-nowrap xl:whitespace-normal">{s.title}</span>
                      <span className={`hidden xl:block font-sans text-[11px] ${active ? "text-white/55" : "text-navy/45"}`}>
                        {done ? "Complete" : "In progress"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:block bg-white rounded-xl border border-navy/10 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-navy/45">Completeness</span>
                <span className="font-mono text-[13px] text-teal-deep">{completion}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-navy/10 overflow-hidden">
                <div className="h-full bg-teal transition-all" style={{ width: `${completion}%` }} />
              </div>
              <p className="font-sans text-[11px] text-navy/45 mt-3">
                {savedAt
                  ? `Draft autosaved ${new Date(savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                  : "Draft saves automatically"}
              </p>
            </div>
          </div>
        </aside>

        {/* Form */}
        <main className={`xl:col-span-5 ${mobilePreview ? "hidden xl:block" : ""}`}>
          <StageHeading i={step} />

          {step === 0 && (
            <div className="space-y-5">
              <div className={card}>
                {!tierEnabled && (
                  <div>
                    <label className={labelCls}>Total quote amount (£)</label>
                    <Input type="number" placeholder="12000" value={amount} onChange={(e) => setAmount(e.target.value)} className={fieldCls} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>VAT status</label>
                  <select value={vatStatus} onChange={(e) => setVatStatus(e.target.value)}
                    className="w-full h-10 rounded-md border border-navy/15 bg-white px-3 font-mono text-sm">
                    <option value="">Select…</option>
                    <option value="inclusive">Includes VAT</option>
                    <option value="exclusive">Excludes VAT</option>
                    <option value="not_registered">Not VAT registered</option>
                  </select>
                </div>
                {(vatStatus === "inclusive" || vatStatus === "exclusive") && (
                  <div>
                    <label className={labelCls}>VAT amount (£, optional)</label>
                    <Input type="number" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} className={fieldCls} />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Quote valid until</label>
                    <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={fieldCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Estimated start date</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={fieldCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Estimated duration</label>
                  <Input placeholder="e.g. 3–4 weeks" value={duration} onChange={(e) => setDuration(e.target.value)} className={fieldCls} />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="font-sans text-[13px] font-medium text-navy-deep">Deposit required?</p>
                  <Switch checked={depositRequired} onCheckedChange={setDepositRequired} />
                </div>
                {depositRequired && (
                  <div>
                    <label className={labelCls}>Deposit amount (£)</label>
                    <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className={fieldCls} />
                  </div>
                )}
              </div>

              <div className={card}>
                <div>
                  <label className={labelCls}>Scope of works — exactly what is included</label>
                  <Textarea
                    placeholder="Include labour, materials, site setup, waste removal, making good, certification and handover where relevant."
                    value={message} onChange={(e) => setMessage(e.target.value)}
                    className="font-sans text-sm min-h-[180px] bg-white border-navy/15" />
                  <p className="font-mono text-[11px] text-navy/40 mt-1.5">{message.trim().length} characters</p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className={card}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sans text-[14px] font-medium text-navy-deep">Offer material tier options?</p>
                    <p className="font-sans text-[12px] text-navy/50 mt-0.5">
                      Let the homeowner choose Budget, Standard or Premium materials.
                    </p>
                  </div>
                  <Switch checked={tierEnabled} onCheckedChange={setTierEnabled} />
                </div>
                {tierEnabled && (
                  <div className="space-y-4 pt-2">
                    {([
                      ["TIER 1 — BUDGET", TIER_HINTS.budget, budgetPrice, setBudgetPrice, budgetDesc, setBudgetDesc, false],
                      ["TIER 2 — STANDARD", TIER_HINTS.standard, standardPrice, setStandardPrice, standardDesc, setStandardDesc, true],
                      ["TIER 3 — PREMIUM", TIER_HINTS.premium, premiumPrice, setPremiumPrice, premiumDesc, setPremiumDesc, false],
                    ] as const).map(([title, hint, price, setPrice, desc, setDesc, highlight]) => (
                      <div key={title} className={`rounded-xl p-4 border ${highlight ? "border-teal bg-teal/5" : "border-navy/10 bg-cream/50"}`}>
                        <h4 className={`font-heading text-lg ${highlight ? "text-teal-deep" : "text-navy-deep"}`}>{title}</h4>
                        <p className="font-sans text-[11px] text-navy/50 mb-3">{hint}</p>
                        <div className="space-y-2">
                          <Input type="number" placeholder="Price (£)" value={price as string}
                            onChange={(e) => (setPrice as (v: string) => void)(e.target.value)} className={fieldCls} />
                          <Textarea placeholder="Describe materials & finish…" value={desc as string}
                            onChange={(e) => (setDesc as (v: string) => void)(e.target.value)}
                            className="font-sans text-sm min-h-[70px] bg-white border-navy/15" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={card}>
                <MaterialsBreakdown lines={materials} onChange={setMaterials} />
                <div className="flex items-start justify-between gap-4 border-t border-navy/10 pt-4">
                  <div>
                    <p className="font-sans text-[13px] font-medium text-navy-deep">Show material allowances to homeowner</p>
                    <p className="font-sans text-[12px] text-navy/50 mt-0.5">
                      Keep off if your quote is fixed-price and you prefer to show a single total.
                    </p>
                  </div>
                  <Switch checked={shareMaterials} onCheckedChange={setShareMaterials} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className={card}>
                <div>
                  <label className={labelCls}>Exclusions — anything not included</label>
                  <Textarea
                    placeholder="Planning fees, Building Control fees, structural calculations, decorating, floor coverings, asbestos removal…"
                    value={exclusions} onChange={(e) => setExclusions(e.target.value)}
                    className="font-sans text-sm min-h-[120px] bg-white border-navy/15" />
                </div>
                <div>
                  <label className={labelCls}>Assumptions made when pricing</label>
                  <Textarea
                    placeholder="Clear access, drawings accurate, no hidden structural defects, no asbestos, normal working hours…"
                    value={assumptions} onChange={(e) => setAssumptions(e.target.value)}
                    className="font-sans text-sm min-h-[120px] bg-white border-navy/15" />
                </div>
                <div>
                  <label className={labelCls}>Provisional sums — items priced provisionally</label>
                  <Textarea
                    placeholder="Groundworks / foundation depth pending trial holes, drainage connection, unknown substrate…"
                    value={provisionalSums} onChange={(e) => setProvisionalSums(e.target.value)}
                    className="font-sans text-sm min-h-[100px] bg-white border-navy/15" />
                </div>
              </div>

              <div className={card}>
                <h3 className="font-heading text-navy-deep text-xl">Certificates & warranties</h3>
                <div className="space-y-2">
                  {CERT_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex items-center justify-between gap-3 py-1.5 border-b border-navy/5 last:border-0">
                      <span className="font-sans text-[13px] text-navy-deep flex-1">{q.label}</span>
                      <select value={certs[q.key] || ""} onChange={(e) => setCerts({ ...certs, [q.key]: e.target.value })}
                        className="h-9 rounded-md border border-navy/15 bg-white px-2 font-mono text-[12px]">
                        <option value="">—</option>
                        {CERT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className={card}>
                <h3 className="font-heading text-navy-deep text-xl">Terms</h3>
                <div>
                  <label className={labelCls}>Expected working hours</label>
                  <Input placeholder="e.g. 8am–5pm weekdays" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Variation process</label>
                  <Textarea placeholder="How changes to scope or price will be agreed…" value={variationProcess}
                    onChange={(e) => setVariationProcess(e.target.value)} className="font-sans text-sm min-h-[80px] bg-white border-navy/15" />
                </div>
                <div>
                  <label className={labelCls}>Homeowner responsibilities</label>
                  <Textarea placeholder="e.g. clear access, parking, decisions on finishes…" value={homeownerResponsibilities}
                    onChange={(e) => setHomeownerResponsibilities(e.target.value)} className="font-sans text-sm min-h-[80px] bg-white border-navy/15" />
                </div>
                <div>
                  <label className={labelCls}>Cancellation / postponement terms</label>
                  <Textarea placeholder="Notice periods, deposit handling…" value={cancellationTerms}
                    onChange={(e) => setCancellationTerms(e.target.value)} className="font-sans text-sm min-h-[80px] bg-white border-navy/15" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className={card}>
                <h3 className="font-heading text-navy-deep text-xl">Payment schedule</h3>
                <p className="font-sans text-[12px] text-navy/50">
                  Stages should be tied to progress so the homeowner knows exactly when each payment becomes due.
                </p>
                {stages.map((s, i) => (
                  <div key={i} className="rounded-xl p-4 border border-navy/10 bg-cream/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] text-navy/50">Stage {i + 1}</span>
                      <button onClick={() => setStages(stages.filter((_, x) => x !== i))} className="text-destructive" aria-label="Remove stage">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <Input placeholder="Stage name (e.g. Deposit / booking)" value={s.name}
                      onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} className={fieldCls} />
                    <Input placeholder="Description" value={s.description}
                      onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, description: e.target.value } : x))} className={fieldCls} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input type="number" placeholder="Amount (£)" value={s.amount}
                        onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, amount: e.target.value } : x))} className={fieldCls} />
                      <Input placeholder="Due trigger" value={s.trigger}
                        onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, trigger: e.target.value } : x))} className={fieldCls} />
                    </div>
                    {totalAmount > 0 && s.amount && (
                      <p className="font-mono text-[11px] text-navy/45">
                        {Math.round((Number(s.amount) / totalAmount) * 100)}% of total
                      </p>
                    )}
                  </div>
                ))}
                <button onClick={() => setStages([...stages, emptyStage()])}
                  className="flex items-center gap-1.5 font-sans text-[13px] text-teal-deep hover:opacity-80">
                  <Plus className="w-4 h-4" /> Add payment stage
                </button>
                {stages.length > 0 && totalAmount > 0 && Math.abs(stagesTotal - totalAmount) > 1 && (
                  <p className="font-mono text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    Stages total {gbp(stagesTotal)} — quote total is {gbp(totalAmount)}.
                  </p>
                )}
              </div>

              <div className={card}>
                <h3 className="font-heading text-navy-deep text-xl">Final review</h3>
                <div className="grid grid-cols-2 gap-3">
                  {STEPS.map((s, i) => (
                    <div key={s.id} className={`rounded-xl px-4 py-3 border ${stepComplete(i) ? "border-teal/40 bg-teal/5" : "border-navy/10 bg-cream/50"}`}>
                      <p className="font-sans text-[12px] text-navy/55">{s.title}</p>
                      <p className={`font-mono text-[13px] mt-0.5 ${stepComplete(i) ? "text-teal-deep" : "text-navy/45"}`}>
                        {stepComplete(i) ? "Complete" : "Incomplete"}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setGateIssues(buildIssues()); setGateOpen(true); }}
                  disabled={submitting}
                  className="w-full bg-teal text-navy-deep font-sans text-[15px] font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting…" : tierEnabled ? "Review & submit tiered quote" : "Review & submit quote"}
                </button>
              </div>
            </div>
          )}

          {/* Stage nav */}
          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="font-sans text-[13px] px-5 py-3 rounded-xl border border-navy/15 text-navy-deep bg-white disabled:opacity-40 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            <span className="font-mono text-[11px] text-navy/40 hidden sm:block">
              {savedAt ? `Autosaved ${new Date(savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Autosaving"}
            </span>
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={step === 3}
              className="font-sans text-[13px] px-5 py-3 rounded-xl bg-navy text-white disabled:opacity-40 flex items-center gap-2"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        {/* Preview */}
        <aside className={`xl:col-span-4 ${mobilePreview ? "" : "hidden xl:block"}`}>
          <div className="xl:sticky xl:top-24">
            <Preview />
          </div>
        </aside>
      </div>

      {/* Quality gate */}
      {gateOpen && (
        <div className="fixed inset-0 bg-navy-deep/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto border border-navy/10">
            <h3 className="font-heading text-navy-deep text-2xl flex items-center gap-2 mb-2">
              {gateIssues.length === 0
                ? <CheckCircle2 className="w-5 h-5 text-teal-deep" />
                : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              Quote quality check
            </h3>
            {gateIssues.length === 0 ? (
              <p className="font-sans text-sm text-navy/60 mb-4">Your quote looks clear and ready to submit.</p>
            ) : (
              <>
                <p className="font-sans text-sm text-navy/60 mb-3">
                  {critical
                    ? "Some critical details are missing and must be added before you can submit:"
                    : "Your quote can be submitted, but the following items may need improving."}
                </p>
                <ul className="space-y-2 mb-4">
                  {gateIssues.map((iss, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[13px]">
                      <span className={iss.critical ? "text-destructive font-bold" : "text-amber-600 font-bold"}>
                        {iss.critical ? "✕" : "!"}
                      </span>
                      <span className="text-navy-deep">{iss.message}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setGateOpen(false)}
                className="font-sans text-sm px-4 py-2.5 rounded-xl border border-navy/15 text-navy-deep">
                Improve quote
              </button>
              {!critical && (
                <button onClick={persistQuote} disabled={submitting}
                  className="font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-teal text-navy-deep disabled:opacity-60">
                  {submitting ? "Submitting…" : gateIssues.length === 0 ? "Submit quote" : "Submit anyway"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteBuilder;
