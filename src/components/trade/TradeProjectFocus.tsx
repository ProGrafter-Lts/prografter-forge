import { ArrowRight, Hammer, PoundSterling, UserCheck } from "lucide-react";
import { useOpenProject } from "@/lib/projectNav";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import {
  buildProjectActions,
  formatPence,
  HEALTH_LABEL,
  type ProjectSnapshot,
} from "@/lib/projectSpine";
import SiteUpdateComposer from "@/components/project/SiteUpdateComposer";

const dateLabel = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "TBC";

/**
 * TRADE OPERATIONAL COUNTERPART of the homeowner project panel.
 * Same project, same numbers — read through the shared project spine.
 */
const TradeProjectFocus = ({
  snapshot,
  tradeId,
  onChanged,
}: {
  snapshot: ProjectSnapshot;
  tradeId: string;
  onChanged?: () => void;
}) => {
  const openProject = useOpenProject();
  const openDrawer = useDrawerNavigate();
  const actions = buildProjectActions(snapshot, "trade");

  return (
    <section className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Current project</p>
            <h2 className="font-heading text-primary text-2xl mt-1">{snapshot.title}</h2>
            {(snapshot.address || snapshot.postcode) && (
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {[snapshot.address, snapshot.postcode].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <span className="font-mono text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground">
            {HEALTH_LABEL[snapshot.health]}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Current stage" value={snapshot.currentStage?.stage_name ?? "—"} />
          <Metric label="Next milestone" value={snapshot.nextStage?.stage_name ?? "—"} />
          <Metric label="Forecast completion" value={dateLabel(snapshot.expectedCompletion)} />
          <Metric label="Progress" value={`${snapshot.progressPercent}%`} />
        </div>

        <button
          onClick={() => openProject(snapshot.jobId)}
          className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90"
        >
          Open project <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5" /> Customer actions waiting
          </p>
          {actions.length === 0 ? (
            <p className="font-mono text-sm text-muted-foreground">Nothing waiting on the homeowner.</p>
          ) : (
            actions.map((a) => (
              <button
                key={a.id}
                onClick={() => openProject(snapshot.jobId)}
                className="w-full flex items-center justify-between gap-3 text-left rounded-xl border border-border px-4 py-3 hover:border-secondary/40"
              >
                <span className="font-mono text-sm text-primary">{a.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <PoundSterling className="w-3.5 h-3.5" /> Commercial position
          </p>
          <Row label="Approved project value" value={formatPence(snapshot.contractValuePence)} />
          <Row label="Approved variations" value={formatPence(snapshot.approvedVariationsPence)} />
          <Row label="Current value" value={formatPence(snapshot.currentProjectValuePence)} strong />
          <Row label="Paid to date" value={formatPence(snapshot.paidPence)} />
          <Row
            label="Next payment trigger"
            value={snapshot.nextPaymentStage?.stage_name ?? "None scheduled"}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Hammer className="w-3.5 h-3.5" /> Today
        </p>
        <p className="font-mono text-sm text-primary mt-2">
          {snapshot.currentStage
            ? `Deliver ${snapshot.currentStage.stage_name}${
                snapshot.currentStage.planned_end ? ` — planned to ${dateLabel(snapshot.currentStage.planned_end)}` : ""
              }.`
            : "No open stage on this project."}
        </p>
      </div>

      <SiteUpdateComposer snapshot={snapshot} tradeId={tradeId} onPosted={onChanged} />
    </section>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-heading text-primary text-lg mt-1">{value}</p>
  </div>
);

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="font-mono text-xs text-muted-foreground">{label}</span>
    <span className={`font-mono text-sm ${strong ? "text-secondary" : "text-primary"}`}>{value}</span>
  </div>
);

export default TradeProjectFocus;
