import { Trash2, Plus, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MaterialUnit = "each" | "m" | "m2" | "kg" | "l" | "hours";
export type MaterialCategory =
  | "electrical"
  | "plumbing"
  | "timber"
  | "fixings"
  | "paint"
  | "glass"
  | "insulation"
  | "other";

export interface MaterialLine {
  description: string;
  brand: string;
  model_or_spec: string;
  quantity: string;
  unit: MaterialUnit;
  unit_price_ex_vat: string;
  vat_rate_pct: string; // default "20"
  category: MaterialCategory | "";
  merchant_hint: string;
}

export const emptyMaterialLine = (): MaterialLine => ({
  description: "",
  brand: "",
  model_or_spec: "",
  quantity: "",
  unit: "each",
  unit_price_ex_vat: "",
  vat_rate_pct: "20",
  category: "",
  merchant_hint: "",
});

const UNITS: { value: MaterialUnit; label: string }[] = [
  { value: "each", label: "each" },
  { value: "m", label: "m" },
  { value: "m2", label: "m²" },
  { value: "kg", label: "kg" },
  { value: "l", label: "l" },
  { value: "hours", label: "hours" },
];

const CATEGORIES: MaterialCategory[] = [
  "electrical",
  "plumbing",
  "timber",
  "fixings",
  "paint",
  "glass",
  "insulation",
  "other",
];

const fmtGbp = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    Number.isFinite(n) ? n : 0,
  );

export const computeLineTotals = (line: MaterialLine) => {
  const qty = parseFloat(line.quantity) || 0;
  const unit = parseFloat(line.unit_price_ex_vat) || 0;
  const vat = parseFloat(line.vat_rate_pct) || 0;
  const ex = qty * unit;
  const inc = ex * (1 + vat / 100);
  return { ex, inc };
};

interface Props {
  lines: MaterialLine[];
  onChange: (lines: MaterialLine[]) => void;
}

const MaterialsBreakdown = ({ lines, onChange }: Props) => {
  const update = (i: number, patch: Partial<MaterialLine>) => {
    const next = lines.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const add = () => onChange([...lines, emptyMaterialLine()]);
  const remove = (i: number) => onChange(lines.filter((_, idx) => idx !== i));

  const subtotalEx = lines.reduce((s, l) => s + computeLineTotals(l).ex, 0);
  const subtotalInc = lines.reduce((s, l) => s + computeLineTotals(l).inc, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        <h4 className="font-heading text-sm text-primary">Materials Breakdown</h4>
        <span className="font-mono text-[10px] text-muted-foreground">(optional)</span>
      </div>

      {lines.map((line, i) => {
        const { ex, inc } = computeLineTotals(line);
        const lineEx = ex;
        const showBrandWarning = lineEx > 500 && !line.brand.trim();

        return (
          <div
            key={i}
            className="bg-muted/30 rounded-xl p-3 border border-border space-y-2 relative"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Description (e.g. Hager 10-way consumer unit)"
                  value={line.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  className="font-mono text-sm"
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Qty"
                    value={line.quantity}
                    onChange={(e) => update(i, { quantity: e.target.value })}
                    className="font-mono"
                  />
                  <Select
                    value={line.unit}
                    onValueChange={(v) => update(i, { unit: v as MaterialUnit })}
                  >
                    <SelectTrigger className="font-mono text-sm">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="Unit £ ex VAT"
                    value={line.unit_price_ex_vat}
                    onChange={(e) => update(i, { unit_price_ex_vat: e.target.value })}
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Brand (optional)"
                    value={line.brand}
                    onChange={(e) => update(i, { brand: e.target.value })}
                    className="font-mono text-sm"
                  />
                  <Input
                    placeholder="Model / spec (optional)"
                    value={line.model_or_spec}
                    onChange={(e) => update(i, { model_or_spec: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>

                <Select
                  value={line.category || undefined}
                  onValueChange={(v) =>
                    update(i, { category: v as MaterialCategory })
                  }
                >
                  <SelectTrigger className="font-mono text-sm">
                    <SelectValue placeholder="Category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between pt-1">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    = {fmtGbp(ex)} ex VAT ({fmtGbp(inc)} inc VAT)
                  </p>
                  {showBrandWarning && (
                    <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                      Add brand for higher-value items where possible
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(i)}
                disabled={lines.length === 1}
                aria-label="Delete material line"
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:hover:text-muted-foreground p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-2 font-mono text-xs text-primary hover:opacity-80"
      >
        <Plus className="w-3.5 h-3.5" /> Add another item
      </button>

      <div className="border-t border-border pt-2 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">Materials subtotal</span>
        <span className="font-mono text-sm text-primary">
          {fmtGbp(subtotalEx)} ex VAT ({fmtGbp(subtotalInc)} inc VAT)
        </span>
      </div>
    </div>
  );
};

export default MaterialsBreakdown;
