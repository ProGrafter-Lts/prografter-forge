import { Phone, Mail, Globe, ShieldCheck, Building2 } from "lucide-react";

interface Props {
  trade: any;
  warranties: any[];
  jobType?: string | null;
  postcode?: string | null;
}

interface RegulatoryBody {
  label: string;
  name: string;
  phone?: string;
  website?: string;
}

/**
 * Map a project type to its primary UK regulatory body for warranty / complaint escalation.
 */
const regulatoryBodyForJobType = (jobType?: string | null): RegulatoryBody | null => {
  const t = (jobType || "").toLowerCase();
  if (/electric/.test(t)) {
    return { label: "Electrical Regulator", name: "NICEIC", phone: "0333 015 6625", website: "niceic.com" };
  }
  if (/(gas|boiler|heating)/.test(t)) {
    return { label: "Gas Regulator", name: "Gas Safe Register", phone: "0800 408 5500", website: "gassaferegister.co.uk" };
  }
  if (/(window|door|glaz)/.test(t)) {
    return { label: "Glazing Regulator", name: "FENSA", phone: "020 7645 3700", website: "fensa.org.uk" };
  }
  if (/(plumb|water)/.test(t)) {
    return { label: "Plumbing Body", name: "CIPHE", phone: "01708 472791", website: "ciphe.org.uk" };
  }
  if (/(extension|structural|loft|conversion|build|roof)/.test(t)) {
    return { label: "Building Regs", name: "Local Authority Building Control (LABC)", phone: "0344 561 6136", website: "labc.co.uk" };
  }
  return null;
};

const ManualContacts = ({ trade, warranties, jobType, postcode }: Props) => {
  // Extract unique claim contacts from warranties
  const claimContacts = [...new Set(
    warranties
      .filter(w => w.claim_contact)
      .map(w => `${w.item}: ${w.claim_contact}`)
  )];

  const regulator = regulatoryBodyForJobType(jobType);

  return (
    <section id="contacts" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Phone className="w-5 h-5 text-secondary" />
        7. Key Contacts
      </h2>

      <div className="space-y-4">
        {trade && (
          <div className="p-4 border border-border rounded-xl">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Your Trade Professional
            </h3>
            <p className="font-mono text-xs text-foreground font-semibold">{trade.company_name || trade.name}</p>
            {trade.company_name && trade.name && trade.name !== trade.company_name && (
              <p className="font-mono text-xs text-muted-foreground">{trade.name}</p>
            )}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {trade.phone && (
                <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                  <Phone className="w-3 h-3 text-secondary" />
                  {trade.phone}
                </span>
              )}
              {trade.email && (
                <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                  <Mail className="w-3 h-3 text-secondary" />
                  {trade.email}
                </span>
              )}
            </div>
          </div>
        )}

        {regulator && (
          <div className="p-4 border border-border rounded-xl">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" /> {regulator.label}
            </h3>
            <p className="font-mono text-xs text-foreground font-semibold">{regulator.name}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {regulator.phone && (
                <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                  <Phone className="w-3 h-3 text-secondary" />
                  {regulator.phone}
                </span>
              )}
              {regulator.website && (
                <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                  <Globe className="w-3 h-3 text-secondary" />
                  {regulator.website}
                </span>
              )}
            </div>
          </div>
        )}

        {/(extension|structural|loft|conversion|build|roof)/.test((jobType || "").toLowerCase()) && (
          <div className="p-4 border border-border rounded-xl">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Local Building Control
            </h3>
            <p className="font-mono text-xs text-foreground">
              Contact your local council's Building Control team{postcode ? ` for ${postcode}` : ""}.
              Find yours at <span className="text-secondary">labc.co.uk/find</span>.
            </p>
          </div>
        )}

        <div className="p-4 border border-border rounded-xl">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            ProGrafter Support
          </h3>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 font-mono text-xs text-foreground">
              <Mail className="w-3 h-3 text-secondary" />
              hello@prografter.co.uk
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-foreground">
              <Globe className="w-3 h-3 text-secondary" />
              prografter.co.uk
            </span>
          </div>
        </div>

        {claimContacts.length > 0 && (
          <div className="p-4 border border-border rounded-xl">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Warranty Claim Contacts
            </h3>
            {claimContacts.map((c, i) => (
              <p key={i} className="font-mono text-xs text-foreground">{c}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ManualContacts;
