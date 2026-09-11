import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Material {
  id: string;
  category: string;
  manufacturer: string;
  product_name: string;
  specification: string;
  quantity: string;
  colour_finish: string;
  supplier: string;
  batch_reference: string;
}

const BLANK = {
  category: "",
  manufacturer: "",
  product_name: "",
  specification: "",
  quantity: "",
  colour_finish: "",
  supplier: "",
  batch_reference: "",
};

/**
 * Permanent property specification record. Populated from the project's own
 * materials log; the homeowner may add anything that was never captured during
 * delivery, without re-entering what ProGrafter already holds.
 */
const ManualMaterials = ({
  materials,
  jobId,
  tradeId,
  canAdd = false,
}: {
  materials: Material[];
  jobId: string;
  tradeId?: string | null;
  canAdd?: boolean;
}) => {
  const [rows, setRows] = useState<Material[]>(materials);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.category.trim() || !tradeId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("materials_log")
      .insert({ job_id: jobId, trade_id: tradeId, ...form } as any)
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Couldn't add that item.");
      return;
    }
    if (data) setRows((r) => [...r, data as any]);
    setForm({ ...BLANK });
    setAdding(false);
    toast.success("Added to your property record.");
  };

  return (
    <section id="materials" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-secondary" />
        2. Materials & Specifications
      </h2>

      {rows.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No materials have been logged for this project yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Item", "Manufacturer", "Product", "Spec", "Qty", "Colour/Finish", "Supplier", "Batch Ref"].map(h => (
                  <th key={h} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-left py-2 pr-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="font-mono text-xs py-2 pr-3">{m.category}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.manufacturer}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.product_name}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.specification}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.quantity}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.colour_finish}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.supplier}</td>
                  <td className="font-mono text-xs py-2 pr-3">{m.batch_reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canAdd && tradeId && (
        <div className="mt-4 print:hidden">
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 font-mono text-xs text-secondary hover:underline"
            >
              <Plus className="w-3 h-3" /> Add an item that wasn't recorded
            </button>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(Object.keys(BLANK) as (keyof typeof BLANK)[]).map((key) => (
                <input
                  key={key}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={key.replace(/_/g, " ")}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-xs"
                />
              ))}
              <div className="col-span-2 md:col-span-4 flex gap-2">
                <button
                  onClick={save}
                  disabled={saving || !form.category.trim()}
                  className="rounded-xl bg-secondary text-white font-mono text-xs px-4 py-2 disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save item"}
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="rounded-xl border border-border font-mono text-xs px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ManualMaterials;
