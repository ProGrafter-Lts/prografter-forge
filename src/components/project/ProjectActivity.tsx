import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Banknote,
  FileSignature,
  AlertTriangle,
  Gavel,
  ClipboardCheck,
  MessageSquare,
  Image as ImageIcon,
  FilePlus2,
  Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  jobId: string;
  /** Optional: switch the homeowner control-centre tab instead of navigating away. */
  onOpenTab?: (tab: string) => void;
}

type Category =
  | "funding"
  | "contract"
  | "variation"
  | "dispute"
  | "escalation"
  | "inspection"
  | "message"
  | "photos"
  | "survey";

interface ActivityItem {
  id: string;
  at: string;
  category: Category;
  label: string;
  description: string;
  linkLabel?: string;
  route?: string;
  tab?: string;
}

const CAT_META: Record<Category, { icon: typeof Activity; label: string; tone: JobFileTone }> = {
  funding: { icon: Banknote, label: "Funding", tone: "green" },
  contract: { icon: FileSignature, label: "Contract", tone: "sky" },
  variation: { icon: FilePlus2, label: "Variation", tone: "amber" },
  dispute: { icon: Gavel, label: "Dispute", tone: "red" },
  escalation: { icon: AlertTriangle, label: "Escalation", tone: "orange" },
  inspection: { icon: ClipboardCheck, label: "Inspection", tone: "indigo" },
  message: { icon: MessageSquare, label: "Message", tone: "teal" },
  photos: { icon: ImageIcon, label: "Site diary", tone: "purple" },
  survey: { icon: Compass, label: "Survey", tone: "grey" },
};


const humanise = (s: string) =>
  s.replace(/[_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const money = (pence?: number | null) =>
  typeof pence === "number" ? `£${(pence / 100).toLocaleString("en-GB")}` : null;

/** Group timestamps within this window into one "batch" for photo uploads. */
const BATCH_WINDOW_MS = 10 * 60 * 1000;

/**
 * Read-only chronological merge of every existing event source for a project.
 * No new tables — purely a view over data other features already write.
 */
const ProjectActivity = ({ jobId, onOpenTab }: Props) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "all">("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);

      // Resolve related parent ids first (contracts, wallets, disputes, surveys).
      const [contractsRes, walletsRes, disputesRes, surveysRes] = await Promise.all([
        supabase.from("contracts").select("id, reference").eq("job_id", jobId),
        supabase.from("project_wallets").select("id").eq("job_id", jobId),
        supabase.from("disputes").select("id, ref").eq("job_id", jobId),
        supabase.from("atlas_surveys").select("id, project_title").eq("job_id", jobId),
      ]);

      const contractIds = (contractsRes.data || []).map((c: any) => c.id);
      const walletIds = (walletsRes.data || []).map((w: any) => w.id);
      const disputeIds = (disputesRes.data || []).map((d: any) => d.id);
      const surveyIds = (surveysRes.data || []).map((s: any) => s.id);
      const disputeRefById = new Map((disputesRes.data || []).map((d: any) => [d.id, d.ref]));

      const empty = { data: [] as any[] };
      const [
        drawdown,
        contractEvents,
        variations,
        escalations,
        disputeEvents,
        atlasEvents,
        messages,
        photos,
        reports,
      ] = await Promise.all([
        walletIds.length
          ? supabase
              .from("drawdown_audit_events")
              .select("id, event_type, actor_role, detail, created_at")
              .in("wallet_id", walletIds)
          : Promise.resolve(empty),
        contractIds.length
          ? supabase
              .from("contract_events")
              .select("id, event_type, actor_role, created_at")
              .in("contract_id", contractIds)
          : Promise.resolve(empty),
        contractIds.length
          ? supabase
              .from("contract_variations")
              .select(
                "id, title, status, cost_change_pence, commission_pence, created_at, activated_at, rejected_at",
              )
              .in("contract_id", contractIds)
          : Promise.resolve(empty),
        supabase
          .from("job_escalation_events")
          .select("id, source, expired_count, released_count, note, created_at")
          .eq("job_id", jobId),
        disputeIds.length
          ? supabase
              .from("dispute_events")
              .select("id, dispute_id, event_type, event_text, occurred_at, created_at")
              .in("dispute_id", disputeIds)
          : Promise.resolve(empty),
        surveyIds.length
          ? supabase
              .from("atlas_audit_events")
              .select("id, survey_id, entity_type, action, created_at")
              .in("survey_id", surveyIds)
          : Promise.resolve(empty),
        supabase
          .from("project_messages")
          .select("id, sender_type, created_at")
          .eq("job_id", jobId),
        supabase
          .from("job_photos")
          .select("id, uploaded_by, created_at")
          .eq("job_id", jobId),
        supabase
          .from("stage_inspection_reports")
          .select("id, file_name, classification, inspector_name, created_at")
          .eq("job_id", jobId),
      ]);

      if (cancelled) return;

      const next: ActivityItem[] = [];

      for (const e of drawdown.data || []) {
        const amount = money((e.detail as any)?.amount_pence ?? (e.detail as any)?.expected_amount_pence);
        const stage = (e.detail as any)?.stage_name;
        next.push({
          id: `dd-${e.id}`,
          at: e.created_at,
          category: "funding",
          label: "Funding",
          description: [humanise(e.event_type), stage, amount].filter(Boolean).join(" · "),
          linkLabel: "Open wallet",
          route: `/project/${jobId}/wallet`,
        });
      }

      for (const e of contractEvents.data || []) {
        next.push({
          id: `ce-${e.id}`,
          at: e.created_at,
          category: "contract",
          label: "Contract",
          description: [humanise(e.event_type), e.actor_role && `by ${e.actor_role}`]
            .filter(Boolean)
            .join(" · "),
          linkLabel: "Open contract",
          route: `/project/${jobId}/contract`,
        });
      }

      for (const v of variations.data || []) {
        const cost = money(v.cost_change_pence);
        const push = (at: string | null, verb: string) => {
          if (!at) return;
          next.push({
            id: `var-${v.id}-${verb}`,
            at,
            category: "variation",
            label: "Variation",
            description: [`Variation ${verb}: ${v.title}`, cost].filter(Boolean).join(" · "),
            linkLabel: "Open contract",
            route: `/project/${jobId}/contract`,
          });
        };
        push(v.created_at, "proposed");
        push(v.activated_at, "accepted");
        push(v.rejected_at, "rejected");
      }

      for (const e of escalations.data || []) {
        next.push({
          id: `esc-${e.id}`,
          at: e.created_at,
          category: "escalation",
          label: "Escalation",
          description:
            e.note ||
            `${humanise(e.source || "escalation")} · ${e.expired_count ?? 0} invitation(s) expired, ${
              e.released_count ?? 0
            } released`,
        });
      }

      for (const e of disputeEvents.data || []) {
        next.push({
          id: `de-${e.id}`,
          at: e.occurred_at || e.created_at,
          category: "dispute",
          label: "Dispute",
          description: [
            disputeRefById.get(e.dispute_id) ? `Dispute ${disputeRefById.get(e.dispute_id)}` : "Dispute",
            e.event_text || humanise(e.event_type),
          ]
            .filter(Boolean)
            .join(" · "),
          linkLabel: "Open dispute",
          route: `/disputes/${e.dispute_id}`,
        });
      }

      for (const e of atlasEvents.data || []) {
        next.push({
          id: `atlas-${e.id}`,
          at: e.created_at,
          category: "survey",
          label: "Survey",
          description: `Site survey · ${humanise(e.action)} (${humanise(e.entity_type || "record")})`,
          linkLabel: "Open survey",
          route: `/atlas/survey/${e.survey_id}`,
        });
      }

      for (const r of reports.data || []) {
        next.push({
          id: `insp-${r.id}`,
          at: r.created_at,
          category: "inspection",
          label: "Inspection",
          description: [
            `Inspection report uploaded: ${r.file_name || "report"}`,
            r.classification ? String(r.classification).toUpperCase() : null,
            r.inspector_name,
          ]
            .filter(Boolean)
            .join(" · "),
          linkLabel: "Open wallet",
          route: `/project/${jobId}/wallet`,
        });
      }

      // Messages: one entry per message, no content duplicated.
      for (const m of messages.data || []) {
        next.push({
          id: `msg-${m.id}`,
          at: m.created_at,
          category: "message",
          label: "Message",
          description: `Message sent by ${m.sender_type === "trade" ? "the trade" : "the homeowner"}`,
          linkLabel: "Open conversation",
          tab: "messages",
        });
      }

      // Photos: grouped per upload batch (same uploader, within 10 minutes).
      const sortedPhotos = [...(photos.data || [])].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      let batch: any[] = [];
      const flush = () => {
        if (!batch.length) return;
        const last = batch[batch.length - 1];
        next.push({
          id: `photos-${batch[0].id}`,
          at: last.created_at,
          category: "photos",
          label: "Site diary",
          description: `${batch.length} photo${batch.length === 1 ? "" : "s"} added${
            last.uploaded_by ? ` by ${last.uploaded_by}` : ""
          }`,
          linkLabel: "Open site diary",
          tab: "photos",
        });
        batch = [];
      };
      for (const p of sortedPhotos) {
        if (!batch.length) {
          batch.push(p);
          continue;
        }
        const prev = batch[batch.length - 1];
        const sameBatch =
          prev.uploaded_by === p.uploaded_by &&
          new Date(p.created_at).getTime() - new Date(prev.created_at).getTime() < BATCH_WINDOW_MS;
        if (sameBatch) batch.push(p);
        else {
          flush();
          batch.push(p);
        }
      }
      flush();

      next.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setItems(next);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  if (loading) {
    return <p className="font-mono text-sm text-muted-foreground">Loading project activity…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
        <p className="font-mono text-sm text-muted-foreground">
          No activity recorded yet. Funding, contract, inspection, message and photo events appear
          here in the order they happened.
        </p>
      </div>
    );
  }

  const present = Array.from(new Set(items.map((i) => i.category))) as Category[];
  const shown = filter === "all" ? items : items.filter((i) => i.category === filter);

  const open = (item: ActivityItem) => {
    if (item.tab && onOpenTab) onOpenTab(item.tab);
    else if (item.route) navigate(item.route);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-xs text-muted-foreground mr-1">
          {items.length} event{items.length === 1 ? "" : "s"} · shared factual record
        </p>
        <button
          onClick={() => setFilter("all")}
          className={`font-mono text-[10px] px-2.5 py-1 rounded-full border ${
            filter === "all" ? "border-secondary text-secondary" : "border-border text-muted-foreground"
          }`}
        >
          All
        </button>
        {present.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`font-mono text-[10px] px-2.5 py-1 rounded-full border ${
              filter === c ? "border-secondary text-secondary" : "border-border text-muted-foreground"
            }`}
          >
            {CAT_META[c].label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <ol className="relative">
          {shown.map((item, i) => {
            const meta = CAT_META[item.category];
            const Icon = meta.icon;
            return (
              <li key={item.id} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-full border border-border flex items-center justify-center bg-background">
                    <Icon className={`w-3.5 h-3.5 ${meta.tone}`} />
                  </span>
                  {i < shown.length - 1 && <span className="flex-1 w-px bg-border mt-1" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {fmtWhen(item.at)}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-foreground mt-0.5 break-words">
                    {item.description}
                  </p>
                  {(item.route || item.tab) && (
                    <button
                      onClick={() => open(item)}
                      className="font-mono text-[10px] text-secondary hover:underline mt-1"
                    >
                      {item.linkLabel || "Open"} →
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default ProjectActivity;
