import { Package } from "lucide-react";

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

const ManualMaterials = ({ materials, jobId }: { materials: Material[]; jobId: string }) => {
  return (
    <section id="materials" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-secondary" />
        2. Materials & Specifications
      </h2>

      {materials.length === 0 ? (
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
              {materials.map(m => (
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
    </section>
  );
};

export default ManualMaterials;
