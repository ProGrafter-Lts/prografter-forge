import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderArchive, ShieldCheck, FileText, Package, ClipboardCheck, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AccentCard,
  JobFileEmpty,
  JobFilePanel,
  JOB_FILE_ICON_TONE,
  SectionHeading,
  TonePill,
  type JobFileTone,
} from "@/components/project/jobFileUi";

interface Props {
  jobId: string;
}

interface DocItem {
  id: string;
  name: string;
  meta: string;
  date: string | null;
  /** Short status/category label rendered as a TradeVault-style badge. */
  status?: string;
  statusTone?: JobFileTone;
  /** Direct URL (certificates) */
  href?: string;
  /** Storage path + bucket — signed on click */
  bucket?: string;
  path?: string;
  /** Internal route */
  route?: string;
}

interface Group {
  key: string;
  label: string;
  icon: typeof FileText;
  tone: JobFileTone;
  items: DocItem[];
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

const statusTone = (status?: string | null): JobFileTone => {
  const s = (status || "").toLowerCase();
  if (["signed", "accepted", "approved", "active", "complete", "completed"].includes(s)) return "green";
  if (["rejected", "expired", "declined", "cancelled"].includes(s)) return "red";
  if (["draft", "pending", "sent", "awaiting_signature", "issued"].includes(s)) return "amber";
  return "grey";
};

const classificationTone = (c?: string | null): JobFileTone => {
  const s = (c || "").toUpperCase();
  if (s === "CLEAR") return "green";
  if (s === "HOLD") return "red";
  if (s === "MIXED") return "amber";
  return "grey";
};


/**
 * Read-only aggregation of everything that already exists for a project:
 * certificates, warranties, materials log, contract + quote PDFs and
 * inspection reports. No new storage — this is a view over existing tables.
 */
const ProjectDocuments = ({ jobId }: Props) => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [certs, warranties, materials, contracts, quotes, reports] = await Promise.all([
        supabase
          .from("project_certificates")
          .select("id, cert_type, document_name, issuing_body, reference_number, issue_date, file_url, created_at")
          .eq("job_id", jobId),
        supabase
          .from("project_warranties")
          .select("id, item, manufacturer, warranty_period_months, expiry_date, coverage, claim_contact, created_at")
          .eq("job_id", jobId),
        supabase
          .from("materials_log")
          .select("id, category, manufacturer, product_name, specification, quantity, supplier, created_at")
          .eq("job_id", jobId),
        supabase
          .from("contracts")
          .select("id, reference, status, latest_pdf_path, latest_pdf_generated_at, created_at")
          .eq("job_id", jobId),
        supabase
          .from("quotes")
          .select("id, reference, status, amount, pdf_path, pdf_generated_at, created_at")
          .eq("job_id", jobId),
        supabase
          .from("stage_inspection_reports")
          .select("id, file_name, file_path, inspector_name, report_date, classification, created_at")
          .eq("job_id", jobId),
      ]);

      if (cancelled) return;

      const next: Group[] = [
        {
          key: "certificates",
          label: "Certificates & compliance",
          icon: ShieldCheck,
          tone: "green",
          items: (certs.data || []).map((c: any) => ({
            id: c.id,
            name: c.document_name || c.cert_type,
            meta: [c.issuing_body, c.reference_number && `Ref ${c.reference_number}`]
              .filter(Boolean)
              .join(" · "),
            date: c.issue_date || c.created_at,
            status: c.cert_type,
            statusTone: "green" as JobFileTone,
            href: c.file_url || undefined,
          })),
        },
        {
          key: "contracts",
          label: "Contracts",
          icon: FileText,
          tone: "sky",
          items: (contracts.data || []).map((c: any) => ({
            id: c.id,
            name: c.reference ? `Contract ${c.reference}` : "Contract",
            meta: "Signed contract record",
            status: c.status,
            statusTone: statusTone(c.status),
            date: c.latest_pdf_generated_at || c.created_at,
            bucket: c.latest_pdf_path ? "quote-pdfs" : undefined,
            path: c.latest_pdf_path || undefined,
            route: c.latest_pdf_path ? undefined : `/project/${jobId}/contract`,
          })),
        },
        {
          key: "quotes",
          label: "Quotes",
          icon: FileText,
          tone: "teal",
          items: (quotes.data || []).map((q: any) => ({
            id: q.id,
            name: q.reference ? `Quote ${q.reference}` : "Quote",
            meta: q.amount ? `£${Number(q.amount).toLocaleString()}` : "Amount not set",
            status: q.status,
            statusTone: statusTone(q.status),
            date: q.pdf_generated_at || q.created_at,
            bucket: q.pdf_path ? "quote-pdfs" : undefined,
            path: q.pdf_path || undefined,
            route: q.pdf_path ? undefined : `/quotes/${q.id}`,
          })),
        },
        {
          key: "inspections",
          label: "Inspection reports",
          icon: ClipboardCheck,
          tone: "indigo",
          items: (reports.data || []).map((r: any) => ({
            id: r.id,
            name: r.file_name || "Inspection report",
            meta: r.inspector_name || "Inspector not recorded",
            status: r.classification || undefined,
            statusTone: classificationTone(r.classification),
            date: r.report_date || r.created_at,
            bucket: r.file_path ? "inspection-reports" : undefined,
            path: r.file_path || undefined,
          })),
        },
        {
          key: "warranties",
          label: "Warranties",
          icon: BadgeCheck,
          tone: "amber",
          items: (warranties.data || []).map((w: any) => ({
            id: w.id,
            name: w.item,
            meta: [w.manufacturer, w.claim_contact].filter(Boolean).join(" · "),
            status: w.warranty_period_months ? `${w.warranty_period_months} months` : undefined,
            statusTone: "amber" as JobFileTone,
            date: w.expiry_date || w.created_at,
          })),
        },
        {
          key: "materials",
          label: "Materials log",
          icon: Package,
          tone: "purple",
          items: (materials.data || []).map((m: any) => ({
            id: m.id,
            name: m.product_name || m.category,
            meta: [m.manufacturer, m.specification, m.quantity, m.supplier].filter(Boolean).join(" · "),
            status: m.category || undefined,
            statusTone: "purple" as JobFileTone,
            date: m.created_at,
          })),
        },
      ];


      setGroups(next);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const openStored = async (bucket: string, path: string) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  if (loading) {
    return (
      <JobFilePanel>
        <p className="font-mono text-sm text-muted-foreground">Loading project documents…</p>
      </JobFilePanel>
    );
  }

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  if (total === 0) {
    return (
      <JobFilePanel>
        <JobFileEmpty icon={<FolderArchive className="w-6 h-6" />}>
          No documents yet. Quotes, contracts, certificates, warranties, materials and inspection reports
          appear here automatically as they're added to the project.
        </JobFileEmpty>
      </JobFilePanel>
    );
  }

  return (
    <JobFilePanel className="space-y-6">
      <p className="font-mono text-xs text-muted-foreground">
        {total} item{total === 1 ? "" : "s"} · read-only record of everything filed against this project.
      </p>
      {groups
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <section key={group.key}>
            <SectionHeading
              icon={<group.icon className={`w-4 h-4 ${JOB_FILE_ICON_TONE[group.tone]}`} />}
              title={group.label}
              count={group.items.length}
            />
            <div className="space-y-2">
              {group.items.map((item) => (
                <AccentCard key={item.id} tone={item.statusTone || group.tone}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-foreground truncate">{item.name}</p>
                      {item.meta && (
                        <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">{item.meta}</p>
                      )}
                      {item.status && (
                        <TonePill tone={item.statusTone || group.tone} className="mt-2">
                          {item.status}
                        </TonePill>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="font-mono text-[10px] text-muted-foreground">{fmt(item.date)}</span>
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-secondary hover:underline"
                        >
                          View →
                        </a>
                      ) : item.bucket && item.path ? (
                        <button
                          onClick={() => openStored(item.bucket!, item.path!)}
                          className="font-mono text-[10px] text-secondary hover:underline"
                        >
                          View →
                        </button>
                      ) : item.route ? (
                        <button
                          onClick={() => navigate(item.route!)}
                          className="font-mono text-[10px] text-secondary hover:underline"
                        >
                          Open →
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground/50">Record</span>
                      )}
                    </div>
                  </div>
                </AccentCard>
              ))}
            </div>
          </section>
        ))}

    </JobFilePanel>

  );
};

export default ProjectDocuments;
