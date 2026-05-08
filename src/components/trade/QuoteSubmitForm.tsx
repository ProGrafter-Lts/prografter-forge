import { useState } from "react";
import { PoundSterling, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MaterialsBreakdown, {
  emptyMaterialLine,
  type MaterialLine,
} from "./MaterialsBreakdown";

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

const QuoteSubmitForm = ({ jobId, tradeId, onQuoteSubmitted }: QuoteSubmitFormProps) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
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

  const canSubmit = tierEnabled
    ? budgetPrice && standardPrice && premiumPrice && message.trim().length >= 10
    : amount && message.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Filter out blank rows; validate the rest
    const filledMaterials = materials.filter(
      (m) => m.description.trim() || m.quantity || m.unit_price_ex_vat,
    );
    for (const m of filledMaterials) {
      if (m.description.trim().length < 3) {
        toast.error("Each material line needs a description (min 3 characters)");
        return;
      }
      const qty = parseFloat(m.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error("Material quantity must be a positive number");
        return;
      }
      const price = parseFloat(m.unit_price_ex_vat);
      if (!Number.isFinite(price) || price < 0) {
        toast.error("Material unit price must be 0 or greater");
        return;
      }
    }

    setSubmitting(true);

    const baseAmount = tierEnabled ? Number(standardPrice) : Number(amount);

    const insertData: any = {
      job_id: jobId,
      trade_id: tradeId,
      amount: baseAmount,
      message: message.trim(),
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
      .select("id")
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

    toast.success("Quote submitted successfully!");
    onQuoteSubmitted();
    setSubmitting(false);
  };

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
      <h3 className="font-heading text-primary text-lg flex items-center gap-2">
        <PoundSterling className="w-4 h-4" /> Submit Your Quote
      </h3>

      {/* Main amount (hidden when tiers enabled) */}
      {!tierEnabled && (
        <div>
          <label className="font-mono text-xs text-muted-foreground block mb-1">
            Quote Amount (£)
          </label>
          <Input
            type="number"
            placeholder="e.g. 12000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-mono"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="font-mono text-xs text-muted-foreground block mb-1">
          Description / Scope of Works
        </label>
        <Textarea
          placeholder="Describe the work you'll carry out, materials, timescales…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="font-mono text-sm min-h-[80px]"
        />
      </div>

      {/* Tier toggle */}
      <div className="flex items-center justify-between py-2 border-t border-b border-border">
        <div>
          <p className="font-heading text-sm text-primary">Offer material tier options?</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            Let homeowners choose Budget, Standard, or Premium materials
          </p>
        </div>
        <Switch checked={tierEnabled} onCheckedChange={setTierEnabled} />
      </div>

      {/* Tier sections */}
      {tierEnabled && (
        <div className="space-y-4">
          {/* Budget */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <h4 className="font-heading text-sm text-primary mb-1">TIER 1 — BUDGET</h4>
            <p className="font-mono text-[10px] text-muted-foreground mb-3">{TIER_HINTS.budget}</p>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Price (£)"
                value={budgetPrice}
                onChange={(e) => setBudgetPrice(e.target.value)}
                className="font-mono"
              />
              <Textarea
                placeholder="Describe budget tier materials & finish…"
                value={budgetDesc}
                onChange={(e) => setBudgetDesc(e.target.value)}
                className="font-mono text-sm min-h-[60px]"
              />
            </div>
          </div>

          {/* Standard */}
          <div className="bg-secondary/5 rounded-xl p-4 border-2 border-secondary">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-heading text-sm text-secondary">TIER 2 — STANDARD</h4>
              <span className="bg-secondary text-secondary-foreground font-mono text-[10px] px-2 py-0.5 rounded-full">
                Pre-selected
              </span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mb-3">{TIER_HINTS.standard}</p>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Price (£)"
                value={standardPrice}
                onChange={(e) => setStandardPrice(e.target.value)}
                className="font-mono"
              />
              <Textarea
                placeholder="Describe standard tier materials & finish…"
                value={standardDesc}
                onChange={(e) => setStandardDesc(e.target.value)}
                className="font-mono text-sm min-h-[60px]"
              />
            </div>
          </div>

          {/* Premium */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border">
            <h4 className="font-heading text-sm text-primary mb-1">TIER 3 — PREMIUM</h4>
            <p className="font-mono text-[10px] text-muted-foreground mb-3">{TIER_HINTS.premium}</p>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Price (£)"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(e.target.value)}
                className="font-mono"
              />
              <Textarea
                placeholder="Describe premium tier materials & finish…"
                value={premiumDesc}
                onChange={(e) => setPremiumDesc(e.target.value)}
                className="font-mono text-sm min-h-[60px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Materials breakdown */}
      <div className="border-t border-border pt-4 space-y-3">
        <MaterialsBreakdown lines={materials} onChange={setMaterials} />

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-heading text-xs text-primary">Share materials with homeowner?</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              Off by default — protects your pricing margin
            </p>
          </div>
          <Switch checked={shareMaterials} onCheckedChange={setShareMaterials} />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full bg-secondary text-secondary-foreground font-mono text-sm py-3 rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Submitting…" : tierEnabled ? "Submit Tiered Quote" : "Submit Quote"}
      </button>
    </div>
  );
};

export default QuoteSubmitForm;
