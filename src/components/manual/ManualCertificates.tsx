import { ShieldCheck, AlertCircle } from "lucide-react";

interface Certificate {
  id: string;
  cert_type: string;
  document_name: string;
  issuing_body: string;
  reference_number: string;
  issue_date: string | null;
  file_url: string;
}

interface CertSlot {
  type: string;
  required: boolean;
}

const ALL_CERTS = [
  "Building Control Completion Certificate",
  "FENSA / CERTASS Window/Door Certificate",
  "NICEIC / NAPIT Electrical Installation Certificate",
  "Gas Safe Certificate",
  "Structural Engineer Sign-off",
  "Other Compliance Documentation",
];

/**
 * Decide which certificates are mandatory based on project type.
 * Electrical work needs Part P / NICEIC. Extensions and structural work
 * need Building Control + Structural Engineer sign-off.
 */
const certSlotsForJobType = (jobType?: string | null): CertSlot[] => {
  const t = (jobType || "").toLowerCase();
  const required = new Set<string>();

  if (/electric/.test(t)) {
    required.add("NICEIC / NAPIT Electrical Installation Certificate");
  }
  if (/(extension|structural|loft|conversion|build)/.test(t)) {
    required.add("Building Control Completion Certificate");
    required.add("Structural Engineer Sign-off");
  }
  if (/(gas|boiler|heating)/.test(t)) {
    required.add("Gas Safe Certificate");
  }
  if (/(window|door|glaz)/.test(t)) {
    required.add("FENSA / CERTASS Window/Door Certificate");
  }

  return ALL_CERTS.map((type) => ({ type, required: required.has(type) }));
};

const ManualCertificates = ({
  certificates,
  jobId: _jobId,
  jobType,
}: {
  certificates: Certificate[];
  jobId: string;
  jobType?: string | null;
}) => {
  const slots = certSlotsForJobType(jobType);

  // Match an uploaded cert against a slot (case-insensitive substring match).
  const matchUploaded = (slotType: string) =>
    certificates.find(
      (c) =>
        (c.cert_type || "").toLowerCase().includes(slotType.split(" ")[0].toLowerCase()) ||
        (c.document_name || "").toLowerCase().includes(slotType.split(" ")[0].toLowerCase()),
    );

  return (
    <section id="certificates" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-secondary" />
        3. Certificates & Compliance
      </h2>

      <div className="space-y-3">
        {slots.map(({ type, required }) => {
          const uploaded = matchUploaded(type);
          const missingRequired = required && !uploaded;

          return (
            <div
              key={type}
              className={`flex items-center gap-3 py-2 border-b border-border/50 ${
                missingRequired ? "bg-rose-50/40 -mx-2 px-2 rounded" : ""
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  uploaded
                    ? "bg-secondary"
                    : missingRequired
                    ? "bg-rose-500"
                    : "bg-muted-foreground/30"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-mono text-xs ${
                      uploaded
                        ? "text-foreground"
                        : missingRequired
                        ? "text-rose-700 font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {uploaded?.document_name || type}
                  </span>
                  {required ? (
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      Required
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Optional
                    </span>
                  )}
                </div>
                {uploaded && (
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {uploaded.issuing_body && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Issued by: {uploaded.issuing_body}
                      </span>
                    )}
                    {uploaded.reference_number && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Ref: {uploaded.reference_number}
                      </span>
                    )}
                    {uploaded.issue_date && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Date: {new Date(uploaded.issue_date).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {uploaded?.file_url ? (
                <a
                  href={uploaded.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-secondary hover:text-secondary/80"
                >
                  View →
                </a>
              ) : missingRequired ? (
                <span className="font-mono text-[10px] text-rose-700 inline-flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Outstanding
                </span>
              ) : (
                <span className="font-mono text-[10px] text-muted-foreground/50">Not uploaded</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ManualCertificates;
