import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDrawerNavigate } from "@/hooks/useDrawerNavigate";
import { SearchCheck, Shield, ArrowRight, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import VerifiedTradeBadge from "@/components/trade/VerifiedTradeBadge";
import { getVerdictTheme, type AiVerdict } from "@/lib/quoteVerdict";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Quote {
  id: string;
  amount: number;
  message: string | null;
  status: string;
  job_id: string;
  ai_verdict?: AiVerdict;
  ai_verdict_summary?: string | null;
  tier_enabled?: boolean;
  budget_price?: number | null;
  budget_description?: string | null;
  standard_price?: number | null;
  standard_description?: string | null;
  premium_price?: number | null;
  premium_description?: string | null;
  selected_tier?: string | null;
  vat_status?: string | null;
  valid_until?: string | null;
  estimated_start_date?: string | null;
  estimated_duration_text?: string | null;
  scope_of_works?: string | null;
  exclusions?: string | null;
  assumptions?: string | null;
  deposit_required?: boolean | null;
  deposit_amount?: number | null;
  payment_schedule?: { name?: string; amount?: number; percentage?: number | null }[] | null;
  certifications?: Record<string, string> | null;
  pdf_path?: string | null;

  trades: {
    name: string;
    company_name: string;
    verified: boolean;
    review_count?: number;
    avg_rating?: number | null;
    tier?: string | null;
    trade_type?: string | null;
    cps_scheme?: string | null;
    cps_registration_number?: string | null;
    gas_safe_number?: string | null;
  } | null;
  jobs: { title: string | null; job_type: string } | null;
}

interface QuotesReceivedProps {
  quotes: Quote[];
  onSelectTier?: (quoteId: string, tier: string, price: number) => void;
  onQuoteAccepted?: () => void;
}

const TIER_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  unverified: "Unverified",
};

const RatingDisplay = ({
  reviewCount,
  avgRating,
  tier,
}: {
  reviewCount?: number;
  avgRating?: number | null;
  tier?: string | null;
}) => {
  if (!reviewCount || reviewCount === 0) {
    return (
      <div className="flex items-center gap-2 mt-1">
        {tier && tier !== "unverified" && (
          <Badge variant="outline" className="text-[10px] font-mono">
            {TIER_LABELS[tier] ?? tier}
          </Badge>
        )}
        <span className="font-mono text-[10px] text-muted-foreground italic">
          Awaiting first review
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="font-mono text-xs text-primary font-medium">
        {Number(avgRating).toFixed(1)}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
      </span>
    </div>
  );
};

const Detail = ({ k, v }: { k: string; v: string }) => (
  <div className="min-w-0">
    <p className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{k}</p>
    <p className="font-mono text-[11px] text-primary truncate">{v}</p>
  </div>
);


const CONFIRM_ITEMS = [
  "I understand what is included.",
  "I understand what is excluded.",
  "I understand the agreed payment stages.",
  "I understand the VAT status.",
  "I understand the expected project duration.",
  "I understand how changes / variations will be handled.",
  "I have reviewed the AI Quote Checker, or chosen to continue without one.",
];

const VAT_LABEL: Record<string, string> = {
  inclusive: "Includes VAT",
  exclusive: "Excludes VAT",
  not_registered: "Not VAT registered",
};

function quoteClarity(q: Quote): { label: string; cls: string } {
  if (q.ai_verdict) {
    if (q.ai_verdict === "high_risk") return { label: "Needs clarification", cls: "bg-amber-100 text-amber-800" };
    return { label: "Looks clear", cls: "bg-emerald-100 text-emerald-800" };
  }
  const missing = !q.scope_of_works || !q.exclusions || !q.vat_status || !q.estimated_duration_text;
  if (missing) return { label: "Missing key details", cls: "bg-rose-100 text-rose-800" };
  return { label: "Not checked", cls: "bg-slate-100 text-slate-700" };
}


const QuotesReceived = ({ quotes, onQuoteAccepted }: QuotesReceivedProps) => {
  const navigate = useNavigate();
  const openDrawer = useDrawerNavigate();
  const [pendingAccept, setPendingAccept] = useState<Quote | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [checked, setChecked] = useState<boolean[]>(() => CONFIRM_ITEMS.map(() => false));
  const allConfirmed = checked.every(Boolean);

  const openAcceptDialog = (q: Quote) => {
    setChecked(CONFIRM_ITEMS.map(() => false));
    setPendingAccept(q);
  };
  const toggleChecked = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));


  const handleAccept = async () => {
    if (!pendingAccept) return;
    setAccepting(true);

    const acceptedTradeName =
      pendingAccept.trades?.company_name || pendingAccept.trades?.name || "The tradesperson";

    // 1. Mark all sibling quotes on this job as declined
    const siblingIds = quotes
      .filter(
        (q) =>
          q.job_id === pendingAccept.job_id &&
          q.id !== pendingAccept.id &&
          q.status === "pending",
      )
      .map((q) => q.id);

    if (siblingIds.length > 0) {
      const { error: declineErr } = await supabase
        .from("quotes")
        .update({ status: "declined" })
        .in("id", siblingIds);
      if (declineErr) {
        console.error("Failed to auto-decline sibling quotes", declineErr);
      }
    }

    // 2. Generate the contract via SECURITY DEFINER RPC.
    // The RPC marks the quote accepted, snapshots both parties, and creates
    // the contract row in awaiting_signatures. We then route the homeowner
    // straight to the contract page to review and sign.
    const { data: contractId, error: rpcErr } = await supabase.rpc("generate_contract_for_quote", {
      _quote_id: pendingAccept.id,
    });

    setAccepting(false);

    if (rpcErr || !contractId) {
      toast.error(rpcErr?.message || "Couldn't accept quote — please try again.");
      return;
    }

    // Fire quote-accepted notifications (trade + homeowner + admin). Non-blocking.
    void supabase.functions.invoke("notify-quote-accepted", {
      body: { quote_id: pendingAccept.id },
    });

    toast.success(`Quote accepted. ${acceptedTradeName} will be in touch. Review and sign your contract now.`);
    const targetJobId = pendingAccept.job_id;
    setPendingAccept(null);
    onQuoteAccepted?.();
    openDrawer(`/project/${targetJobId}/contract`);
  };

  if (quotes.length === 0) {
    return (
      <section>
        <h2 className="font-heading text-primary text-2xl mb-4">Quotes Received</h2>
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <SearchCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">
            No quotes yet. Trades will submit quotes once matched to your job.
          </p>
        </div>
      </section>
    );
  }

  // Group quotes by job for compare button
  const byJob = quotes.reduce<Record<string, Quote[]>>((acc, q) => {
    (acc[q.job_id] ||= []).push(q);
    return acc;
  }, {});
  const compareableJobIds = Object.entries(byJob)
    .filter(([, qs]) => qs.length >= 2)
    .map(([jobId]) => jobId);

  // A job has an accepted quote if any quote on it is 'accepted'
  const jobHasAccepted = (jobId: string) =>
    (byJob[jobId] || []).some((q) => q.status === "accepted");

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-primary text-2xl">Quotes Received</h2>
        {compareableJobIds.length > 0 && (
          <button
            onClick={() => openDrawer(`/project/${compareableJobIds[0]}/compare`)}
            className="bg-secondary text-secondary-foreground font-mono text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm inline-flex items-center gap-2"
          >
            Compare All Quotes <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {quotes.map((q) => {
          const theme = getVerdictTheme(q.ai_verdict);
          const VIcon = theme.icon;
          const company = q.trades?.company_name || q.trades?.name || "Tradesperson";
          const jobAccepted = jobHasAccepted(q.job_id);
          const isAccepted = q.status === "accepted";
          const isDeclined = q.status === "declined";
          const isPending = q.status === "pending";

          return (
            <div
              key={q.id}
              className={`bg-card rounded-2xl p-5 border border-border shadow-sm ${theme.borderClass} ${
                isDeclined ? "opacity-60" : ""
              }`}
            >
              {/* Status banner — only show the AI verdict pill when a verdict has actually been computed.
                  Platform-matched quotes don't run through Quote Checker, so a "Pending" pill there
                  would be misleading. */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {q.ai_verdict && (
                  <Badge className={`${theme.badgeClass} font-mono text-[10px] inline-flex items-center gap-1`}>
                    <VIcon className={`w-3 h-3 ${theme.iconClass}`} />
                    {theme.label}
                  </Badge>
                )}
                {isAccepted && (
                  <Badge className="bg-green-100 text-green-700 font-mono text-[10px]">
                    Accepted
                  </Badge>
                )}
                {isDeclined && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Declined
                  </Badge>
                )}
                {q.ai_verdict && (
                  <span className="font-mono text-[10px] text-muted-foreground hidden sm:inline">
                    {theme.description}
                  </span>
                )}
              </div>

              {q.ai_verdict_summary && (
                <p className="font-mono text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  {q.ai_verdict_summary}
                </p>
              )}

              {/* Trade header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading text-primary text-lg truncate">
                      {company}
                    </h3>
                    {q.trades?.verified && (
                      <VerifiedTradeBadge
                        compact
                        tradeType={q.trades.trade_type}
                        cpsScheme={q.trades.cps_scheme}
                        cpsRegistrationNumber={q.trades.cps_registration_number}
                        gasSafeNumber={q.trades.gas_safe_number}
                      />
                    )}
                  </div>
                  {q.trades?.name && q.trades.name !== company && (
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {q.trades.name}
                    </p>
                  )}
                  <RatingDisplay
                    reviewCount={q.trades?.review_count}
                    avgRating={q.trades?.avg_rating}
                    tier={q.trades?.tier}
                  />
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading text-secondary text-2xl">
                    £{Number(q.amount).toLocaleString()}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">inc VAT</p>
                </div>
              </div>

              {q.message && (
                <p className="font-mono text-xs text-muted-foreground mt-3 line-clamp-3 whitespace-pre-line">
                  {q.message}
                </p>
              )}

              {/* Structured quote details */}
              {(q.vat_status || q.valid_until || q.estimated_start_date || q.estimated_duration_text ||
                (q.payment_schedule && q.payment_schedule.length) || q.exclusions || q.assumptions) && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-muted/40 p-3">
                  {q.vat_status && <Detail k="VAT status" v={VAT_LABEL[q.vat_status] || q.vat_status} />}
                  {q.valid_until && <Detail k="Valid until" v={new Date(q.valid_until).toLocaleDateString("en-GB")} />}
                  {q.estimated_start_date && <Detail k="Est. start" v={new Date(q.estimated_start_date).toLocaleDateString("en-GB")} />}
                  {q.estimated_duration_text && <Detail k="Duration" v={q.estimated_duration_text} />}
                  {q.deposit_required && q.deposit_amount ? <Detail k="Deposit" v={`£${Number(q.deposit_amount).toLocaleString()}`} /> : null}
                  {q.payment_schedule && q.payment_schedule.length > 0 && (
                    <Detail k="Payment stages" v={`${q.payment_schedule.length} stage${q.payment_schedule.length === 1 ? "" : "s"}`} />
                  )}
                </div>
              )}
              {q.exclusions && (
                <p className="font-mono text-[11px] text-muted-foreground mt-2">
                  <span className="text-primary font-semibold">Excludes:</span> {q.exclusions}
                </p>
              )}
              {q.assumptions && (
                <p className="font-mono text-[11px] text-muted-foreground mt-1">
                  <span className="text-primary font-semibold">Assumes:</span> {q.assumptions}
                </p>
              )}

              {/* AI Quote Checker status */}
              {(() => {
                const clarity = quoteClarity(q);
                return (
                  <div className="mt-3 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-heading text-xs text-primary">AI Quote Checker</span>
                      <Badge className={`${clarity.cls} font-mono text-[10px]`}>{clarity.label}</Badge>
                    </div>
                    {!q.ai_verdict && (
                      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
                        Not checked yet — run a AI Quote Checker before accepting to understand what is included,
                        missing or unclear.
                      </p>
                    )}
                  </div>
                );
              })()}

              {q.pdf_path && (
                <button
                  onClick={() => openDrawer(`/project/${q.job_id}`)}
                  className="mt-2 font-mono text-[11px] text-secondary hover:underline"
                >
                  View quote PDF →
                </button>
              )}


              {isAccepted && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="font-mono text-xs text-green-800">
                    Quote accepted. {company} will be in touch to arrange next steps.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {isPending && !jobAccepted && (
                  <button
                    onClick={() => openAcceptDialog(q)}
                    className="bg-secondary text-secondary-foreground font-mono text-xs px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm inline-flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept Quote
                  </button>
                )}
                {isPending && !jobAccepted && (
                  <button
                    onClick={() => openDrawer(`/project/${q.job_id}`)}
                    className="border border-secondary/40 text-secondary font-mono text-xs px-4 py-2 rounded-xl hover:bg-secondary/5 transition-colors"
                  >
                    Ask Builder a Question
                  </button>
                )}
                {isPending && !jobAccepted && (
                  <button
                    onClick={() => openDrawer(`/project/${q.job_id}`)}
                    className="border border-border text-primary font-mono text-xs px-4 py-2 rounded-xl hover:bg-muted transition-colors"
                  >
                    Request Revised Quote
                  </button>
                )}
                {isPending && jobAccepted && (
                  <span className="font-mono text-[11px] text-muted-foreground italic">
                    Another quote already accepted on this job
                  </span>
                )}
                <button
                  onClick={() => openDrawer(`/project/${q.job_id}`)}
                  className="font-mono text-xs text-secondary hover:underline"
                >
                  View project →
                </button>
                {(byJob[q.job_id]?.length ?? 0) >= 2 && (
                  <button
                    onClick={() => openDrawer(`/project/${q.job_id}/compare`)}
                    className="font-mono text-xs text-secondary hover:underline"
                  >
                    Compare with other quotes →
                  </button>
                )}
              </div>


              {q.ai_verdict === "high_risk" && (
                <div className="mt-3 bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="font-mono text-[11px] text-rose-800">
                    <strong>Part P warning:</strong> Self-certification by non-registered installers is not lawful. Notifiable electrical work must be Part P–certified or building-control notified.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={pendingAccept !== null}
        onOpenChange={(open) => !open && setPendingAccept(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept this quote?</AlertDialogTitle>
            <AlertDialogDescription>
              You're accepting{" "}
              <strong>
                {pendingAccept?.trades?.company_name || pendingAccept?.trades?.name || "this trade"}
              </strong>{" "}
              at <strong>£{Number(pendingAccept?.amount || 0).toLocaleString()}</strong>.
              All other pending quotes on this job will be automatically declined.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 my-2">
            <p className="font-mono text-xs text-muted-foreground">
              Before accepting, please confirm:
            </p>
            {CONFIRM_ITEMS.map((item, i) => (
              <label
                key={i}
                className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-border p-2.5 hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() => toggleChecked(i)}
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--secondary))]"
                />
                <span className="font-mono text-xs text-primary leading-relaxed">{item}</span>
              </label>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={accepting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleAccept();
              }}
              disabled={accepting || !allConfirmed}
            >
              {accepting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Accepting…
                </span>
              ) : (
                "Accept Quote"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default QuotesReceived;

