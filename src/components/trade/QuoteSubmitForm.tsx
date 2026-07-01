import { useEffect, useMemo, useState } from "react";
import { PoundSterling, Send, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MaterialsBreakdown, {
  emptyMaterialLine,
  type MaterialLine,
} from "./MaterialsBreakdown";
import {
  checkQuoteQuality,
  hasCriticalIssues,
  type QuoteIssue,
} from "@/lib/quoteQuality";

export interface QuickBuildPrefill {
  generationId: string;
  amount: string;
  message: string;
  workingDays?: number | null;
  methodology?: string | null;
}

interface QuoteSubmitFormProps {
  jobId: string;
  tradeId: string;
  onQuoteSubmitted: () => void;
  quickBuildPrefill?: QuickBuildPrefill | null;
}

const TIER_HINTS = {
  budget: "e.g. Standard range materials, functional finish, fully Building Regulations compliant",
  standard: "e.g. Mid-range materials, quality finish, manufacturer warranties included",
  premium: "e.g. Premium branded materials, superior finish, extended warranties",
};

interface PaymentStage {
  name: string;
  description: string;
  amount: string;
  trigger: string;
}

const emptyStage = (): PaymentStage => ({ name: "", description: "", amount: "", trigger: "" });

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

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div className="border-t border-border pt-4 space-y-3">
    <h4 className="font-heading text-sm text-primary">
      <span className="text-secondary">{n}.</span> {title}
    </h4>
    {children}
  </div>
);

const label = "font-mono text-xs text-muted-foreground block mb-1";

const QuoteSubmitForm = ({ jobId, tradeId, onQuoteSubmitted, quickBuildPrefill }: QuoteSubmitFormProps) => {
  // Section 1 — summary
  const [amount, setAmount] = useState("");
  const [vatStatus, setVatStatus] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [depositRequired, setDepositRequired] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // Section 2 / 5 / 6 — scope, exclusions, assumptions
  const [message, setMessage] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [assumptions, setAssumptions] = useState("");

  // Section 7 — payment schedule
  const [stages, setStages] = useState<PaymentStage[]>([]);

  // Section 8 — certifications
  const [certs, setCerts] = useState<Record<string, string>>({});

  // Section 9 — terms
  const [workingHours, setWorkingHours] = useState("");
  const [variationProcess, setVariationProcess] = useState("");
  const [homeownerResponsibilities, setHomeownerResponsibilities] = useState("");
  const [cancellationTerms, setCancellationTerms] = useState("");

  // Tiers + materials (kept from previous)
  const [tierEnabled, setTierEnabled] = useState(false);
  const [budgetPrice, setBudgetPrice] = useState("");
  const [budgetDesc, setBudgetDesc] = useState("");
  const [standardPrice, setStandardPrice] = useState("");
  const [standardDesc, setStandardDesc] = useState("");
  const [premiumPrice, setPremiumPrice] = useState("");
  const [premiumDesc, setPremiumDesc] = useState("");
  const [materials, setMaterials] = useState<MaterialLine[]>([emptyMaterialLine()]);
  const [shareMaterials, setShareMaterials] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateIssues, setGateIssues] = useState<QuoteIssue[]>([]);

  useEffect(() => {
    if (quickBuildPrefill) {
      setAmount(quickBuildPrefill.amount);
      setMessage(quickBuildPrefill.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickBuildPrefill?.generationId]);

  const totalAmount = tierEnabled ? Number(standardPrice) : Number(amount);

  const certsAnswered = useMemo(
    () => CERT_QUESTIONS.some((q) => certs[q.key]),
    [certs],
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

  const runSubmitFlow = () => {
    const issues = buildIssues();
    setGateIssues(issues);
    setGateOpen(true);
  };

  const persistQuote = async () => {
    setSubmitting(true);
    const filledMaterials = materials.filter(
      (m) => m.description.trim() || m.quantity || m.unit_price_ex_vat,
    );
    for (const m of filledMaterials) {
      if (m.description.trim().length < 3) {
        toast.error("Each material line needs a description (min 3 characters)");
        setSubmitting(false);
        return;
      }
      const qty = parseFloat(m.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error("Material quantity must be a positive number");
        setSubmitting(false);
        return;
      }
      const price = parseFloat(m.unit_price_ex_vat);
      if (!Number.isFinite(price) || price < 0) {
        toast.error("Material unit price must be 0 or greater");
        setSubmitting(false);
        return;
      }
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

    const { data: quoteRow, error } = await supabase
      .from("quotes")
      .insert(insertData)
      .select("id, reference")
      .single();

    if (error || !quoteRow) {
      toast.error("Failed to submit quote");
      setSubmitting(false);
      return;
    }

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
      if (matErr) {
        toast.error("Quote saved, but materials failed to save");
        console.error(matErr);
      }
    }

    // Mark the trade's invitation as quote submitted (best-effort).
    try {
      await supabase
        .from("job_trade_invitations")
        .update({ status: "quote_submitted", quote_submitted_at: new Date().toISOString(), responded_at: new Date().toISOString() })
        .eq("job_id", jobId)
        .eq("trade_id", tradeId);
    } catch { /* non-blocking */ }

    if (quickBuildPrefill?.generationId) {
      await supabase
        .from("quickbuild_generations")
        .update({ quote_id: quoteRow.id, was_sent: true })
        .eq("id", quickBuildPrefill.generationId);
    }

    try {
      const { data: jobRow } = await supabase
        .from("jobs")
        .select("id, title, address, postcode, homeowner_id, job_type")
        .eq("id", jobId)
        .maybeSingle();
      if (jobRow?.homeowner_id) {
        const { data: ownerRow } = await supabase
          .from("homeowners").select("email, name").eq("id", jobRow.homeowner_id).maybeSingle();
        const { data: tradeRow } = await supabase
          .from("trades").select("name, company_name").eq("id", tradeId).maybeSingle();
        if (ownerRow?.email) {
          const projectTitle = jobRow.title || jobRow.job_type || "your project";
          const projectAddress = [jobRow.address, jobRow.postcode].filter(Boolean).join(", ");
          const tradeName = tradeRow?.company_name || tradeRow?.name || "A trade";
          const firstName = ownerRow.name?.split(" ")[0] || undefined;
          void supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "quote-received",
              recipientEmail: ownerRow.email,
              idempotencyKey: `quote-received-${quoteRow.id}`,
              templateData: {
                firstName, tradeName,
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
              reference: quoteRow.reference || quoteRow.id,
              projectTitle: jobRow.title || jobRow.job_type || "a project",
              amount: `£${baseAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
              tradeName: tradeRow?.company_name || tradeRow?.name || "A trade",
              homeownerName: ownerRow?.name || undefined,
              adminUrl: "https://prografter.co.uk/admin/job-briefs",
            },
          },
        });
      }
    } catch (e) {
      console.warn("quote-received email dispatch failed (non-blocking)", e);
    }

    toast.success("Quote submitted successfully!");
    setGateOpen(false);
    onQuoteSubmitted();
    setSubmitting(false);
  };

  const critical = hasCriticalIssues(gateIssues);
  const stagesTotal = stages.reduce((s, st) => s + (Number(st.amount) || 0), 0);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-5">
      <div>
        <h3 className="font-heading text-primary text-lg flex items-center gap-2">
          <PoundSterling className="w-4 h-4" /> Submit Quote
        </h3>
        <p className="font-mono text-[11px] text-muted-foreground mt-1">
          Create a clear quote the homeowner can understand before accepting.
        </p>
      </div>

      {/* Section 1 — Quote Summary */}
      <Section n={1} title="Quote Summary">
        {!tierEnabled && (
          <div>
            <label className={label}>Total quote amount (£)</label>
            <Input type="number" placeholder="e.g. 12000" value={amount}
              onChange={(e) => setAmount(e.target.value)} className="font-mono" />
          </div>
        )}
        <div>
          <label className={label}>VAT status</label>
          <select value={vatStatus} onChange={(e) => setVatStatus(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 font-mono text-sm">
            <option value="">Select…</option>
            <option value="inclusive">Includes VAT</option>
            <option value="exclusive">Excludes VAT</option>
            <option value="not_registered">Not VAT registered</option>
          </select>
        </div>
        {(vatStatus === "inclusive" || vatStatus === "exclusive") && (
          <div>
            <label className={label}>VAT amount (£, optional)</label>
            <Input type="number" value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} className="font-mono" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Quote valid until</label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="font-mono" />
          </div>
          <div>
            <label className={label}>Estimated start date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="font-mono" />
          </div>
        </div>
        <div>
          <label className={label}>Estimated duration</label>
          <Input placeholder="e.g. 3–4 weeks" value={duration} onChange={(e) => setDuration(e.target.value)} className="font-mono" />
        </div>
        <div className="flex items-center justify-between py-1">
          <p className="font-heading text-xs text-primary">Deposit required?</p>
          <Switch checked={depositRequired} onCheckedChange={setDepositRequired} />
        </div>
        {depositRequired && (
          <div>
            <label className={label}>Deposit amount (£)</label>
            <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="font-mono" />
          </div>
        )}
      </Section>

      {/* Section 2 — Scope of Works */}
      <Section n={2} title="Scope of Works">
        <label className={label}>Describe exactly what is included in this quote.</label>
        <Textarea
          placeholder="Include labour, materials, site setup, waste removal, making good, certification and handover where relevant."
          value={message} onChange={(e) => setMessage(e.target.value)}
          className="font-mono text-sm min-h-[100px]" />
      </Section>

      {/* Section 3 — Line items (detailed via tiers/materials) + tier toggle */}
      <Section n={3} title="Line Items & Tiers">
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-heading text-sm text-primary">Offer material tier options?</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              Let homeowners choose Budget, Standard, or Premium materials
            </p>
          </div>
          <Switch checked={tierEnabled} onCheckedChange={setTierEnabled} />
        </div>
        {tierEnabled && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h4 className="font-heading text-sm text-primary mb-1">TIER 1 — BUDGET</h4>
              <p className="font-mono text-[10px] text-muted-foreground mb-3">{TIER_HINTS.budget}</p>
              <div className="space-y-2">
                <Input type="number" placeholder="Price (£)" value={budgetPrice} onChange={(e) => setBudgetPrice(e.target.value)} className="font-mono" />
                <Textarea placeholder="Describe budget tier materials & finish…" value={budgetDesc} onChange={(e) => setBudgetDesc(e.target.value)} className="font-mono text-sm min-h-[60px]" />
              </div>
            </div>
            <div className="bg-secondary/5 rounded-xl p-4 border-2 border-secondary">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-heading text-sm text-secondary">TIER 2 — STANDARD</h4>
                <span className="bg-secondary text-secondary-foreground font-mono text-[10px] px-2 py-0.5 rounded-full">Pre-selected</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground mb-3">{TIER_HINTS.standard}</p>
              <div className="space-y-2">
                <Input type="number" placeholder="Price (£)" value={standardPrice} onChange={(e) => setStandardPrice(e.target.value)} className="font-mono" />
                <Textarea placeholder="Describe standard tier materials & finish…" value={standardDesc} onChange={(e) => setStandardDesc(e.target.value)} className="font-mono text-sm min-h-[60px]" />
              </div>
            </div>
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <h4 className="font-heading text-sm text-primary mb-1">TIER 3 — PREMIUM</h4>
              <p className="font-mono text-[10px] text-muted-foreground mb-3">{TIER_HINTS.premium}</p>
              <div className="space-y-2">
                <Input type="number" placeholder="Price (£)" value={premiumPrice} onChange={(e) => setPremiumPrice(e.target.value)} className="font-mono" />
                <Textarea placeholder="Describe premium tier materials & finish…" value={premiumDesc} onChange={(e) => setPremiumDesc(e.target.value)} className="font-mono text-sm min-h-[60px]" />
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Section 4 — Materials */}
      <Section n={4} title="Materials">
        <MaterialsBreakdown lines={materials} onChange={setMaterials} />
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-heading text-xs text-primary">Show material allowances to homeowner</p>
            <p className="font-mono text-[10px] text-muted-foreground max-w-[80%]">
              Optional. If enabled, the homeowner can see itemised material allowances. Keep off if your quote is
              fixed-price and you prefer to show a single total.
            </p>
          </div>
          <Switch checked={shareMaterials} onCheckedChange={setShareMaterials} />
        </div>
      </Section>

      {/* Section 5 — Exclusions */}
      <Section n={5} title="Exclusions">
        <label className={label}>List anything not included in this quote.</label>
        <Textarea
          placeholder="Planning fees, Building Control fees, structural calculations, kitchen supply, bathroom fittings, decorating, floor coverings, asbestos removal, unforeseen ground conditions…"
          value={exclusions} onChange={(e) => setExclusions(e.target.value)}
          className="font-mono text-sm min-h-[80px]" />
      </Section>

      {/* Section 6 — Assumptions */}
      <Section n={6} title="Assumptions">
        <label className={label}>What have you assumed when pricing this job?</label>
        <Textarea
          placeholder="Clear access, drawings are accurate, no hidden structural defects, no asbestos, services are accessible, normal working hours…"
          value={assumptions} onChange={(e) => setAssumptions(e.target.value)}
          className="font-mono text-sm min-h-[80px]" />
      </Section>

      {/* Section 7 — Payment Schedule */}
      <Section n={7} title="Payment Schedule">
        <p className="font-mono text-[10px] text-muted-foreground">
          Payment stages should be clear and tied to progress. Homeowners should understand when each payment becomes due.
        </p>
        {stages.map((s, i) => (
          <div key={i} className="bg-muted/30 rounded-xl p-3 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">Stage {i + 1}</span>
              <button onClick={() => setStages(stages.filter((_, x) => x !== i))} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <Input placeholder="Stage name (e.g. Deposit / booking)" value={s.name}
              onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} className="font-mono text-sm" />
            <Input placeholder="Description" value={s.description}
              onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, description: e.target.value } : x))} className="font-mono text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Amount (£)" value={s.amount}
                onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, amount: e.target.value } : x))} className="font-mono text-sm" />
              <Input placeholder="Due trigger" value={s.trigger}
                onChange={(e) => setStages(stages.map((x, xi) => xi === i ? { ...x, trigger: e.target.value } : x))} className="font-mono text-sm" />
            </div>
            {totalAmount > 0 && s.amount && (
              <p className="font-mono text-[10px] text-muted-foreground">
                {Math.round((Number(s.amount) / totalAmount) * 100)}% of total
              </p>
            )}
          </div>
        ))}
        <button onClick={() => setStages([...stages, emptyStage()])}
          className="flex items-center gap-1 font-mono text-xs text-secondary">
          <Plus className="w-3 h-3" /> Add payment stage
        </button>
        {stages.length > 0 && totalAmount > 0 && Math.abs(stagesTotal - totalAmount) > 1 && (
          <p className="font-mono text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Stages total £{stagesTotal.toLocaleString()} — quote total is £{totalAmount.toLocaleString()}.
          </p>
        )}
      </Section>

      {/* Section 8 — Certifications & Handover */}
      <Section n={8} title="Certifications & Handover">
        <div className="space-y-2">
          {CERT_QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-primary flex-1">{q.label}</span>
              <select value={certs[q.key] || ""} onChange={(e) => setCerts({ ...certs, [q.key]: e.target.value })}
                className="h-8 rounded-md border border-input bg-background px-2 font-mono text-[11px]">
                <option value="">—</option>
                {CERT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Section>

      {/* Section 9 — Terms */}
      <Section n={9} title="Terms">
        <div>
          <label className={label}>Expected working hours</label>
          <Input placeholder="e.g. 8am–5pm weekdays" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} className="font-mono text-sm" />
        </div>
        <div>
          <label className={label}>Variation process</label>
          <Textarea placeholder="How changes to scope/price will be agreed…" value={variationProcess} onChange={(e) => setVariationProcess(e.target.value)} className="font-mono text-sm min-h-[60px]" />
        </div>
        <div>
          <label className={label}>Homeowner responsibilities</label>
          <Textarea placeholder="e.g. clear access, parking, decisions on finishes…" value={homeownerResponsibilities} onChange={(e) => setHomeownerResponsibilities(e.target.value)} className="font-mono text-sm min-h-[60px]" />
        </div>
        <div>
          <label className={label}>Cancellation / postponement terms</label>
          <Textarea placeholder="Notice periods, deposit handling…" value={cancellationTerms} onChange={(e) => setCancellationTerms(e.target.value)} className="font-mono text-sm min-h-[60px]" />
        </div>
      </Section>

      {/* Section 11 — Submit */}
      <button
        onClick={runSubmitFlow}
        disabled={submitting}
        className="w-full bg-secondary text-secondary-foreground font-mono text-sm py-3 rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Submitting…" : tierEnabled ? "Review & Submit Tiered Quote" : "Review & Submit Quote"}
      </button>

      {/* Quote Quality Check modal */}
      {gateOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto border border-border">
            <h3 className="font-heading text-primary text-lg flex items-center gap-2 mb-2">
              {gateIssues.length === 0
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              Quote Quality Check
            </h3>
            {gateIssues.length === 0 ? (
              <p className="font-mono text-sm text-muted-foreground mb-4">Your quote looks clear and ready to submit.</p>
            ) : (
              <>
                <p className="font-mono text-sm text-muted-foreground mb-3">
                  {critical
                    ? "Some critical details are missing and must be added before you can submit:"
                    : "Your quote can be submitted, but the following items may need improving."}
                </p>
                <ul className="space-y-2 mb-4">
                  {gateIssues.map((iss, i) => (
                    <li key={i} className="flex items-start gap-2 font-mono text-[12px]">
                      <span className={iss.critical ? "text-destructive font-bold" : "text-amber-600 font-bold"}>
                        {iss.critical ? "✕" : "!"}
                      </span>
                      <span className="text-primary">{iss.message}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setGateOpen(false)}
                className="font-mono text-sm px-4 py-2 rounded-xl border border-border text-primary">
                Improve Quote
              </button>
              {!critical && (
                <button onClick={persistQuote} disabled={submitting}
                  className="font-mono text-sm px-4 py-2 rounded-xl bg-secondary text-secondary-foreground disabled:opacity-60">
                  {submitting ? "Submitting…" : gateIssues.length === 0 ? "Submit Quote" : "Submit Anyway"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteSubmitForm;
