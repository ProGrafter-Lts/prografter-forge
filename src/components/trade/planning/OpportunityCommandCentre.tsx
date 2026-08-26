import { useEffect, useRef, useState } from "react";
import {
  X, AlertTriangle, MapPin, Clock, TrendingUp, Target, FileText, ExternalLink,
  Bookmark, CheckCircle2, CalendarClock, Mail, ArrowRightCircle, XCircle,
  StickyNote, ShieldCheck, ChevronDown, Copy, Link2, MoreHorizontal, Sparkles,
} from "lucide-react";
import {
  PlanningApp, scoreOpportunity, getBestAction, getTimingGuidance, getRecommendedNextStep,
  getPlanningTypeLabel, getWorkPackages, getTopStatusMessage, generateIntroLetter,
  OUTREACH_CODE, daysSince, PipelineStatus,
} from "@/lib/planningIntelligence";
import { Interaction, TradeIdentity } from "@/hooks/usePlanningIntelligence";
import { PlanningFeatures } from "@/lib/planningIntelligence";

interface Props {
  app: PlanningApp;
  onClose: () => void;
  isMobile: boolean;
  interaction?: Interaction;
  trade: TradeIdentity | null;
  features: PlanningFeatures;
  onStatus: (status: PipelineStatus) => void;
  onNotes: (notes: string) => void;
  onFollowUp: (date: string | null) => void;
  onCreateInvite: () => Promise<{ url: string } | null>;
  onLetterGenerated: () => void;
  /** Set when the trade already has a live job/quote at this address. */
  engaged?: string;
  /** When true, the panel immediately runs the intro flow (opened via a "Send intro now" chip). */
  autoIntro?: boolean;
  /** Called once the auto-intro has been consumed so the parent can reset its intent. */
  onAutoIntroHandled?: () => void;
}

const label = "font-mono text-[10px] font-semibold uppercase tracking-wider";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className={`${label} text-secondary mb-2`}>{title}</p>
    {children}
  </div>
);

export default function OpportunityCommandCentre({
  app, onClose, isMobile, interaction, trade, features,
  onStatus, onNotes, onFollowUp, onCreateInvite, onLetterGenerated, engaged,
  autoIntro, onAutoIntroHandled,
}: Props) {

  const score = scoreOpportunity(app, trade?.trade_type ? [trade.trade_type.toLowerCase()] : []);
  const action = getBestAction(app);
  const packages = getWorkPackages(app);
  const typeInfo = getPlanningTypeLabel(app.type);
  const age = daysSince(app.submitted_date);

  const [notesDraft, setNotesDraft] = useState(interaction?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [letter, setLetter] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [highlightActions, setHighlightActions] = useState(false);
  const actionsRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    setNotesDraft(interaction?.notes ?? "");
  }, [interaction?.id]);

  useEffect(() => {
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile]);

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleInvite = async () => {
    if (inviteUrl) return inviteUrl;
    setBusy(true);
    const res = await onCreateInvite();
    setBusy(false);
    if (res) setInviteUrl(res.url);
    return res?.url ?? null;
  };

  const handleLetter = async () => {
    let url = inviteUrl;
    if (!url) {
      const res = await onCreateInvite();
      url = res?.url ?? `${window.location.origin}/planning-invite/pending`;
      if (res) setInviteUrl(res.url);
    }
    setLetter(generateIntroLetter(app, trade ?? { name: "", company_name: "", trade_type: "" }, url));
    onLetterGenerated();
  };

  // "Best action: Send intro now" — runs the existing intro flow rather than
  // being decorative text: creates the homeowner invite link (and the intro
  // letter when the trade has that feature), then scrolls to the actions block.
  const runBestAction = async () => {
    setShowMore(true);
    actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightActions(true);
    setTimeout(() => setHighlightActions(false), 2200);
    if (features.can_create_homeowner_invite_links) await handleInvite();
    if (features.can_generate_intro_letters && !letter) await handleLetter();
  };

  // Opened from the feed's "Send intro now" chip → run the same flow on mount.
  const autoIntroDone = useRef(false);
  useEffect(() => {
    if (!autoIntro || engaged || autoIntroDone.current) return;
    autoIntroDone.current = true;
    void runBestAction();
    onAutoIntroHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoIntro, app.id, engaged]);




  const currentStatus = interaction?.status ?? "new";

  const StatBox = ({ k, v }: { k: string; v: string }) => (
    <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/10">
      <p className={`${label} text-cream/50`}>{k}</p>
      <p className="font-mono text-xs font-semibold text-cream mt-1">{v}</p>
    </div>
  );

  const ActionBtn = ({ icon, children, onClick, primary, active }: any) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 font-mono text-[11px] px-3 py-2.5 rounded-xl uppercase tracking-wider transition-colors ${
        primary
          ? "bg-secondary text-primary-foreground hover:bg-secondary/90"
          : active
          ? "bg-secondary/20 text-secondary border border-secondary/40"
          : "bg-white/5 text-cream/80 border border-white/10 hover:bg-white/10"
      }`}
    >
      {icon}
      {children}
    </button>
  );

  const panel = (
    <div
      style={{ backgroundColor: "#0F1F38", ["--cream" as any]: "#F5EFE6" }}
      className={`overflow-hidden flex flex-col text-cream ${
        isMobile ? "h-full rounded-none border-0" : "rounded-2xl border-2 border-secondary sticky top-20 max-h-[calc(100vh-100px)]"
      }`}
    >
      {/* Header */}
      <div className="bg-primary px-5 py-4 flex items-start justify-between gap-3 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-primary-foreground text-sm">{app.address}</p>
          <p className="font-mono text-[11px] text-primary-foreground/70 mt-0.5 uppercase tracking-wider">
            {app.id} · {app.council}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 space-y-5">
        {/* Top status message */}
        <div className="bg-secondary/10 border border-secondary/25 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-secondary" />
          <p className="font-sans text-xs text-cream/90 leading-relaxed">{getTopStatusMessage(app.status)}</p>
        </div>

        {/* Opportunity Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: score.bandColor }} />
              <span className="font-mono text-sm font-bold" style={{ color: score.bandColor }}>
                {score.score} / 100
              </span>
            </div>
            <span
              className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${score.bandColor}22`, color: score.bandColor }}
            >
              {score.band}
            </span>
          </div>
          {engaged && (
            <div className="flex items-start gap-2 border-t border-white/10 pt-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono text-xs font-semibold text-amber-400">Already engaged — no cold intro</p>
                <p className="font-sans text-[11px] text-cream/70 mt-1 leading-relaxed">{engaged}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 border-t border-white/10 pt-3">
            <Target className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              {engaged ? (
                <p className="font-mono text-xs font-semibold text-secondary">
                  Best action: Follow up through the existing job
                </p>
              ) : (
                <button
                  type="button"
                  onClick={runBestAction}
                  className="font-mono text-xs font-semibold text-secondary text-left underline decoration-secondary/40 underline-offset-4 hover:decoration-secondary transition-colors"
                >
                  Best action: {action.label} →
                </button>
              )}
              <p className="font-sans text-[11px] text-cream/70 mt-1 leading-relaxed">{engaged ? engaged : action.explanation}</p>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-2 pt-1">
            <StatBox k="Est. value" v={app.estimated_value} />
            <StatBox k="Planning stage" v={typeInfo.label} />
            <StatBox k="Submitted" v={new Date(app.submitted_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
            <StatBox k="Days since" v={`${age} day${age === 1 ? "" : "s"}`} />
          </div>
        </div>

        {/* Timing guidance */}
        <Section title="Timing guidance">
          <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
            <p className="font-sans text-xs text-cream/80 leading-relaxed">{getTimingGuidance(app)}</p>
          </div>
        </Section>

        {/* Project details */}
        <Section title="Project details">
          <p className="font-sans text-xs text-cream/85 leading-relaxed mb-2">{app.description}</p>
          <p className="font-sans text-[11px] text-cream/55 leading-relaxed mb-3">{typeInfo.helper}</p>
          <div className="grid grid-cols-2 gap-2">
            <StatBox k="Floorspace" v={`${app.floorspace_m2}m²`} />
            <StatBox k="Decision" v={app.decision_date ? new Date(app.decision_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Pending"} />
          </div>
        </Section>

        {/* Likely Work Packages */}
        <Section title="Likely work packages">
          <div className="space-y-2.5">
            {packages.map((grp) => (
              <div key={grp.group}>
                <p className="font-mono text-[10px] uppercase tracking-wider text-cream/50 mb-1">{grp.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {grp.items.map((it) => (
                    <span key={it} className="inline-block bg-secondary/10 text-secondary font-mono text-[10px] px-2 py-0.5 rounded-full border border-secondary/20">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recommended next step */}
        <Section title="Recommended next step">
          <div className="bg-secondary/10 border border-secondary/25 rounded-xl px-4 py-3">
            <p className="font-sans text-xs text-cream/90 leading-relaxed">{getRecommendedNextStep(app)}</p>
          </div>
        </Section>

        {/* Planning documents */}
        <Section title="Planning documents">
          {app.documents_available ? (
            <div className="space-y-1.5">
              {["Site location plan", "Existing drawings", "Proposed drawings", "Design/access statement"].map((d) => (
                <div key={d} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <FileText className="w-3.5 h-3.5 text-secondary" />
                  <span className="font-mono text-[11px] text-cream/80">{d}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-[11px] text-cream/55 leading-relaxed">
              No documents currently available in ProGrafter. Check the council planning portal.
            </p>
          )}
          <p className="font-mono text-[10px] text-cream/40 mt-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Drawing Intelligence™ coming later
          </p>
        </Section>

        {/* Source / evidence */}
        <Section title="Source &amp; evidence">
          {app.source_url ? (
            <a href={app.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[11px] text-secondary hover:underline uppercase tracking-wider">
              <ExternalLink className="w-3.5 h-3.5" /> View planning application
            </a>
          ) : (
            <p className="font-sans text-[11px] text-cream/55">Official planning link not available yet.</p>
          )}
          <p className="font-mono text-[10px] text-cream/40 mt-2">
            Public planning information · Data updated nightly · Last checked today
          </p>
        </Section>

        {/* Action buttons */}
        <div
          ref={actionsRef}
          className={`grid grid-cols-1 gap-2 border-t border-white/10 pt-4 rounded-xl transition-all ${
            highlightActions ? "ring-2 ring-secondary/60 ring-offset-2 ring-offset-transparent" : ""
          }`}
        >

          {features.can_create_homeowner_invite_links && (
            <ActionBtn icon={<Link2 className="w-3.5 h-3.5" />} primary onClick={handleInvite}>
              {busy ? "Creating…" : inviteUrl ? "Invite link ready" : "Create homeowner invite"}
            </ActionBtn>
          )}
          {inviteUrl && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <input readOnly value={inviteUrl} className="flex-1 bg-transparent font-mono text-[10px] text-cream/70 outline-none min-w-0" />
              <button onClick={() => copy(inviteUrl, "invite")} className="text-secondary flex-shrink-0" aria-label="Copy link">
                {copied === "invite" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon={<Bookmark className="w-3.5 h-3.5" />} active={currentStatus === "saved"} onClick={() => onStatus("saved")}>
              Save
            </ActionBtn>
            <ActionBtn icon={<CalendarClock className="w-3.5 h-3.5" />} onClick={() => setShowMore((s) => !s)}>
              {showMore ? "Fewer actions" : "More actions"}
            </ActionBtn>
          </div>
          {showMore && (
            <div className="grid grid-cols-2 gap-2">
              {features.can_generate_intro_letters && (
                <ActionBtn icon={<Mail className="w-3.5 h-3.5" />} onClick={handleLetter}>Generate intro letter</ActionBtn>
              )}
              <ActionBtn icon={<CheckCircle2 className="w-3.5 h-3.5" />} active={currentStatus === "contacted"} onClick={() => onStatus("contacted")}>Mark contacted</ActionBtn>
              <ActionBtn icon={<ArrowRightCircle className="w-3.5 h-3.5" />} active={currentStatus === "converted"} onClick={() => onStatus("converted")}>Convert to project</ActionBtn>
              <ActionBtn icon={<XCircle className="w-3.5 h-3.5" />} active={currentStatus === "dismissed"} onClick={() => onStatus("dismissed")}>Dismiss</ActionBtn>
            </div>
          )}
        </div>

        {/* Follow-up */}
        {features.can_use_follow_up_reminders && (
          <Section title="Follow-up reminder">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={interaction?.follow_up_date ?? ""}
                onChange={(e) => onFollowUp(e.target.value || null)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-mono text-[11px] text-cream outline-none focus:border-secondary [color-scheme:dark]"
              />
              {interaction?.follow_up_date && (
                <button onClick={() => onFollowUp(null)} className="text-cream/50 hover:text-cream" aria-label="Clear follow-up">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {interaction?.follow_up_date && (
              <p className="font-mono text-[10px] text-secondary mt-1.5">
                Follow-up set for {new Date(interaction.follow_up_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </Section>
        )}

        {/* Intro letter output */}
        {letter && (
          <Section title="Intro letter draft">
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-sans text-[11px] text-cream/90 leading-relaxed outline-none focus:border-secondary resize-y"
            />
            <button onClick={() => copy(letter, "letter")} className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-secondary uppercase tracking-wider hover:underline">
              {copied === "letter" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy letter
            </button>
          </Section>
        )}

        {/* Private notes */}
        <Section title="Private notes">
          <textarea
            value={notesDraft}
            onChange={(e) => { setNotesDraft(e.target.value); setNotesSaved(false); }}
            placeholder="Private to your account — e.g. 'Follow up in 2 weeks', 'Ideal for extension package'…"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 font-sans text-[11px] text-cream/90 leading-relaxed outline-none focus:border-secondary resize-y placeholder:text-cream/40"
          />
          <button
            onClick={() => { onNotes(notesDraft); setNotesSaved(true); }}
            className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] text-secondary uppercase tracking-wider hover:underline"
          >
            <StickyNote className="w-3.5 h-3.5" /> {notesSaved ? "Saved" : "Save notes"}
          </button>
        </Section>

        {/* Outreach guidance */}
        <div className="border-t border-white/10 pt-4">
          <button onClick={() => setOutreachOpen((o) => !o)} className="w-full flex items-center justify-between">
            <span className={`${label} text-secondary flex items-center gap-1.5`}>
              <ShieldCheck className="w-3.5 h-3.5" /> ProGrafter Outreach Code
            </span>
            <ChevronDown className={`w-4 h-4 text-cream/50 transition-transform ${outreachOpen ? "rotate-180" : ""}`} />
          </button>
          {outreachOpen && (
            <ul className="mt-3 space-y-1.5">
              {OUTREACH_CODE.map((rule) => (
                <li key={rule} className="flex items-start gap-2 font-sans text-[11px] text-cream/75 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-secondary mt-0.5 flex-shrink-0" />
                  {rule}
                </li>
              ))}
              <li className="font-sans text-[10px] text-cream/45 pt-1">This protects the ProGrafter brand.</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div onClick={onClose} className="fixed inset-0 bg-primary/60 z-[1000] flex items-stretch justify-center">
        <div onClick={(e) => e.stopPropagation()} className="w-full h-full flex flex-col">
          {panel}
        </div>
      </div>
    );
  }
  return panel;
}
