import { Phone, Mail, Globe } from "lucide-react";

interface Props {
  trade: any;
  warranties: any[];
}

const ManualContacts = ({ trade, warranties }: Props) => {
  // Extract unique claim contacts from warranties
  const claimContacts = [...new Set(
    warranties
      .filter(w => w.claim_contact)
      .map(w => `${w.item}: ${w.claim_contact}`)
  )];

  return (
    <section id="contacts" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Phone className="w-5 h-5 text-secondary" />
        7. Key Contacts
      </h2>

      <div className="space-y-4">
        {trade && (
          <div className="p-4 border border-border rounded-xl">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Your Trade Professional
            </h3>
            <p className="font-mono text-xs text-foreground font-semibold">{trade.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{trade.company_name}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                <Phone className="w-3 h-3 text-secondary" />
                {trade.phone}
              </span>
            </div>
          </div>
        )}

        <div className="p-4 border border-border rounded-xl">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            ProGrafter Support
          </h3>
          <div className="flex items-center gap-4">
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
