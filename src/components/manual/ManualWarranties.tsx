import { Shield, AlertTriangle } from "lucide-react";

interface Warranty {
  id: string;
  item: string;
  manufacturer: string;
  warranty_period_months: number;
  expiry_date: string | null;
  coverage: string;
  claim_contact: string;
}

const ManualWarranties = ({ warranties, jobId }: { warranties: Warranty[]; jobId: string }) => {
  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const days = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  };

  return (
    <section id="warranties" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-secondary" />
        4. Warranties
      </h2>

      {warranties.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No warranties have been logged for this project yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Item", "Manufacturer", "Period", "Expiry", "Covers", "How to Claim"].map(h => (
                  <th key={h} className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-left py-2 pr-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {warranties.map(w => (
                <tr key={w.id} className="border-b border-border/50">
                  <td className="font-mono text-xs py-2 pr-3">{w.item}</td>
                  <td className="font-mono text-xs py-2 pr-3">{w.manufacturer}</td>
                  <td className="font-mono text-xs py-2 pr-3">{w.warranty_period_months} months</td>
                  <td className="font-mono text-xs py-2 pr-3">
                    <span className="flex items-center gap-1">
                      {w.expiry_date ? new Date(w.expiry_date).toLocaleDateString("en-GB") : "—"}
                      {isExpiringSoon(w.expiry_date) && (
                        <AlertTriangle className="w-3 h-3 text-destructive" />
                      )}
                    </span>
                  </td>
                  <td className="font-mono text-xs py-2 pr-3">{w.coverage}</td>
                  <td className="font-mono text-xs py-2 pr-3">{w.claim_contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ManualWarranties;
