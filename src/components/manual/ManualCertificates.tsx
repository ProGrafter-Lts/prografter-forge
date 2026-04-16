import { ShieldCheck } from "lucide-react";

interface Certificate {
  id: string;
  cert_type: string;
  document_name: string;
  issuing_body: string;
  reference_number: string;
  issue_date: string | null;
  file_url: string;
}

const CERT_TYPES = [
  "Building Control Completion Certificate",
  "FENSA / CERTASS Window/Door Certificate",
  "NICEIC / NAPIT Electrical Installation Certificate",
  "Gas Safe Certificate",
  "Structural Engineer Sign-off",
  "Other Compliance Documentation",
];

const ManualCertificates = ({ certificates, jobId }: { certificates: Certificate[]; jobId: string }) => {
  return (
    <section id="certificates" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-secondary" />
        3. Certificates & Compliance
      </h2>

      {certificates.length === 0 ? (
        <div className="space-y-3">
          {CERT_TYPES.map(type => (
            <div key={type} className="flex items-center gap-3 py-2 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="font-mono text-xs text-muted-foreground">{type}</span>
              <span className="font-mono text-[10px] text-muted-foreground/50 ml-auto">Not uploaded</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map(cert => (
            <div key={cert.id} className="flex items-center gap-3 py-2 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <div className="flex-1">
                <span className="font-mono text-xs text-foreground">{cert.document_name || cert.cert_type}</span>
                <div className="flex items-center gap-3 mt-0.5">
                  {cert.issuing_body && (
                    <span className="font-mono text-[10px] text-muted-foreground">Issued by: {cert.issuing_body}</span>
                  )}
                  {cert.reference_number && (
                    <span className="font-mono text-[10px] text-muted-foreground">Ref: {cert.reference_number}</span>
                  )}
                  {cert.issue_date && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Date: {new Date(cert.issue_date).toLocaleDateString("en-GB")}
                    </span>
                  )}
                </div>
              </div>
              {cert.file_url && (
                <a
                  href={cert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-secondary hover:text-secondary/80"
                >
                  View →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ManualCertificates;
