import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validateBrief } from "@/lib/briefValidation";

const C = {
  deep: "#0F2238", teal: "#14A8A1", white: "#FFFFFF", border: "#E2E0DA",
  secondary: "#6B6B6B", amberBg: "#FEF3C7", amberBorder: "#FDE68A", amberFg: "#92400E",
  greenFg: "#166534", redBg: "#FEE2E2", redFg: "#991B1B",
};

interface BriefLite {
  id: string; job_id?: string | null; full_name: string; email: string; phone: string;
  postcode: string; property_type: string | null; trade_category_id: string | null;
  job_title: string | null; job_description: string | null; budget_band: string | null;
  timeline: string | null; planning_permission: string | null; building_regs: string | null;
  access_arrangement: string | null; parking_available: string | null;
  needs_scoping?: boolean | null; needs_planning_guidance?: boolean | null;
  published_at?: string | null; status: string;
}

interface MatchedTrade {
  id: string; name: string | null; company_name: string | null; trade_type: string | null;
  postcode: string | null; distance_miles: number; avg_rating: number | null;
  review_count: number | null; rank: number;
  invitation: { status: string; released: boolean; batch_number: number } | null;
}

interface ChecklistItem { label: string; ok: boolean; blocking: boolean }

const STATUS_LABEL: Record<string, string> = {
  invited: "Invited", viewed: "Viewed", interested: "Interested",
  declined: "Declined", quote_submitted: "Quote submitted",
  no_response: "No response", expired: "Expired", replaced: "Replaced",
};

async function adminInvoke(fn: string, body: unknown) {
  const { data: s } = await supabase.auth.getSession();
  let token = s.session?.access_token;
  if (!token) {
    const { data: r } = await supabase.auth.refreshSession();
    token = r.session?.access_token;
  }
  if (!token) throw new Error("Your admin session has expired. Please sign in again.");
  return supabase.functions.invoke(fn, { body, headers: { Authorization: `Bearer ${token}` } });
}

function buildChecklist(b: BriefLite): ChecklistItem[] {
  const issues = validateBrief(b.job_title || "", b.job_description || "");
  const hasProfanity = issues.some((i) => i.flag === "profanity");
  const vagueOrShort = issues.some((i) =>
    ["description_too_short", "description_too_vague", "nonsense", "repeated_chars"].includes(i.flag));
  return [
    { label: "Contact details complete", ok: !!(b.full_name && b.email && b.phone), blocking: true },
    { label: "Postcode valid", ok: !!(b.postcode && b.postcode.trim().length >= 5), blocking: true },
    { label: "Property type provided", ok: !!b.property_type, blocking: false },
    { label: "Job title clear", ok: (b.job_title || "").trim().length >= 6, blocking: true },
    { label: "Job description clear enough", ok: !vagueOrShort, blocking: true },
    { label: "No profanity / offensive language", ok: !hasProfanity, blocking: true },
    { label: "Trade category selected", ok: !!b.trade_category_id, blocking: true },
    { label: "Budget band provided", ok: !!b.budget_band, blocking: false },
    { label: "Timeline provided", ok: !!b.timeline, blocking: false },
    { label: "Planning permission answered", ok: !!b.planning_permission, blocking: false },
    { label: "Building regs answered", ok: !!b.building_regs, blocking: false },
    { label: "Access arrangement completed", ok: !!b.access_arrangement, blocking: false },
    { label: "Parking answered", ok: !!b.parking_available, blocking: false },
    { label: "No scoping call outstanding", ok: !b.needs_scoping, blocking: true },
    { label: "No planning guidance outstanding", ok: !b.needs_planning_guidance, blocking: true },
  ];
}

const chip = (bg: string, fg: string): React.CSSProperties => ({
  fontSize: 10, background: bg, color: fg, padding: "2px 8px", borderRadius: 999, fontWeight: 700,
});

export default function AdminBriefPublishPanel({
  brief, onPublished,
}: { brief: BriefLite; onPublished: (matched: number) => void }) {
  const [trades, setTrades] = useState<MatchedTrade[] | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const checklist = buildChecklist(brief);
  const blockingFlags = checklist.filter((c) => c.blocking && !c.ok).map((c) => c.label);
  const isBlocked = blockingFlags.length > 0;

  const loadTrades = async () => {
    setLoadingTrades(true);
    try {
      const { data, error } = await adminInvoke("match-trades-for-brief", { brief_id: brief.id });
      if (error) throw error;
      const list = (data as any)?.trades as MatchedTrade[] || [];
      setTrades(list);
      // Pre-select top 3 that aren't already invited.
      const pre = new Set(list.filter((t) => !t.invitation).slice(0, 3).map((t) => t.id));
      setSelected(pre);
    } catch (e: any) {
      setMsg("Could not load matched trades: " + (e.message || e));
      setTrades([]);
    } finally {
      setLoadingTrades(false);
    }
  };

  useEffect(() => { loadTrades(); /* eslint-disable-next-line */ }, [brief.id]);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else if (next.size < 3) next.add(id);
    return next;
  });

  const doPublish = async (reason?: string) => {
    setPublishing(true); setMsg(null);
    try {
      const tradeIds = [...selected];
      const waiting = (trades || []).filter((t) => !selected.has(t.id) && !t.invitation).map((t) => t.id);
      const { data, error } = await adminInvoke("publish-job-brief", {
        brief_id: brief.id,
        trade_ids: tradeIds,
        waiting_list_ids: waiting,
        override_reason: reason || null,
        blocking_flags: reason ? blockingFlags : [],
      });
      if (error) throw error;
      const matched = (data as any)?.matched ?? tradeIds.length;
      setMsg(`Published. ${matched} trade(s) invited (batch 1).`);
      setOverrideOpen(false); setOverrideReason("");
      onPublished(matched);
      await loadTrades();
    } catch (e: any) {
      setMsg("Publish failed: " + (e.message || e));
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishClick = () => {
    if (selected.size === 0) { setMsg("Select at least one trade to publish to."); return; }
    if (isBlocked) { setOverrideOpen(true); return; }
    doPublish();
  };

  const releaseNext = async () => {
    if (!brief.job_id) { setMsg("Publish batch 1 first."); return; }
    setReleasing(true); setMsg(null);
    try {
      const { data, error } = await adminInvoke("release-next-batch", { job_id: brief.job_id });
      if (error) throw error;
      const n = (data as any)?.released ?? 0;
      setMsg(n > 0 ? `Released next batch: ${n} trade(s) invited.` : "No further trades to release.");
      await loadTrades();
    } catch (e: any) {
      setMsg("Release failed: " + (e.message || e));
    } finally {
      setReleasing(false);
    }
  };

  const released = (trades || []).filter((t) => t.invitation?.released);
  const waitingList = (trades || []).filter((t) => !t.invitation);
  const counts = {
    viewed: released.filter((t) => ["viewed", "interested", "quote_submitted"].includes(t.invitation!.status)).length,
    interested: released.filter((t) => t.invitation!.status === "interested").length,
    quotes: released.filter((t) => t.invitation!.status === "quote_submitted").length,
    declined: released.filter((t) => t.invitation!.status === "declined").length,
    noResponse: released.filter((t) => t.invitation!.status === "invited").length,
  };

  return (
    <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
      {/* Publish checklist */}
      <div style={{ fontWeight: 800, color: C.deep, fontSize: 13, marginBottom: 8 }}>Publish checklist</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px", marginBottom: 12 }}>
        {checklist.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.deep }}>
            <span style={{ color: c.ok ? C.greenFg : (c.blocking ? C.redFg : C.amberFg), fontWeight: 800 }}>
              {c.ok ? "✓" : (c.blocking ? "✕" : "!")}
            </span>
            <span style={{ opacity: c.ok ? 0.7 : 1 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {isBlocked && (
        <div style={{ background: C.redBg, border: `1px solid ${C.redFg}`, color: C.redFg, borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
          <strong>Blocking flags:</strong> {blockingFlags.join(", ")}. A normal publish is disabled — you can publish with a logged override reason.
        </div>
      )}

      {/* Matched trades */}
      <div style={{ fontWeight: 800, color: C.deep, fontSize: 13, marginBottom: 8 }}>
        Matched trades {trades ? `(${trades.length})` : ""}
      </div>
      {loadingTrades ? (
        <p style={{ color: C.secondary, fontSize: 12 }}>Finding matched trades…</p>
      ) : trades && trades.length === 0 ? (
        <p style={{ color: C.secondary, fontSize: 12 }}>No matching verified trades within range for this job.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {(trades || []).map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
              {!t.invitation && (
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  aria-label={`Select ${t.company_name || t.name}`}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.deep, fontWeight: 600 }}>
                  {t.company_name || t.name || "Trade"}
                  <span style={{ color: C.secondary, fontWeight: 400 }}> — {t.trade_type}</span>
                </div>
                <div style={{ fontSize: 11, color: C.secondary }}>
                  {t.distance_miles} mi · {t.postcode}
                  {t.avg_rating ? ` · ★ ${t.avg_rating} (${t.review_count || 0})` : ""}
                </div>
              </div>
              {t.invitation ? (
                <span style={chip(t.invitation.released ? "#D1FAE5" : "#E5E7EB", t.invitation.released ? C.greenFg : C.secondary)}>
                  {t.invitation.released ? (STATUS_LABEL[t.invitation.status] || t.invitation.status) : `Waiting (batch ${t.invitation.batch_number})`}
                </span>
              ) : (
                <span style={chip("#DBEAFE", "#1E40AF")}>Available</span>
              )}
            </div>
          ))}
        </div>
      )}

      {released.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, fontSize: 11, color: C.secondary }}>
          <span style={chip("#D1FAE5", C.greenFg)}>Invited: {released.length}</span>
          <span style={chip("#DBEAFE", "#1E40AF")}>Viewed: {counts.viewed}</span>
          <span style={chip("#CCFBF1", "#0F766E")}>Interested: {counts.interested}</span>
          <span style={chip("#EDE9FE", "#5B21B6")}>Quotes: {counts.quotes}</span>
          <span style={chip("#FEE2E2", C.redFg)}>Declined: {counts.declined}</span>
          <span style={chip("#E5E7EB", C.secondary)}>No response: {counts.noResponse}</span>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          onClick={handlePublishClick}
          disabled={publishing || (trades || []).length === 0}
          style={{ background: isBlocked ? C.amberFg : C.teal, color: C.white, border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: publishing ? 0.6 : 1 }}
        >
          {publishing ? "Publishing…" : isBlocked ? "Publish anyway (override)" : `Publish to selected (${selected.size})`}
        </button>
        {released.length > 0 && waitingList.length >= 0 && (
          <button
            onClick={releaseNext}
            disabled={releasing}
            style={{ background: C.white, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: releasing ? 0.6 : 1 }}
          >
            {releasing ? "Releasing…" : "Release next batch"}
          </button>
        )}
      </div>

      {msg && <p style={{ marginTop: 10, fontSize: 12, color: C.deep }}>{msg}</p>}

      {escalations.length > 0 && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div style={{ fontWeight: 800, color: C.deep, fontSize: 13, marginBottom: 6 }}>Escalation history</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {escalations.map((e) => (
              <div key={e.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: C.deep }}>
                <span style={chip(e.source === "auto_48h" ? "#FEF3C7" : "#E0E7FF", e.source === "auto_48h" ? C.amberFg : "#3730A3")}>
                  {e.source === "auto_48h" ? "AUTO 48h" : "MANUAL"}
                </span>
                <span style={{ flex: 1 }}>
                  {e.note}
                  <span style={{ color: C.secondary }}> · {new Date(e.created_at).toLocaleString("en-GB")}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override modal */}
      {overrideOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 12, padding: 20, maxWidth: 460, width: "100%" }}>
            <div style={{ fontWeight: 800, color: C.deep, fontSize: 15, marginBottom: 8 }}>Publish with unresolved flags</div>
            <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5, marginBottom: 12 }}>
              Publishing with unresolved flags may result in unclear quotes or unsuitable trade responses. Please record why this is being overridden.
            </p>
            <div style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}`, color: C.amberFg, borderRadius: 8, padding: "8px 10px", fontSize: 12, marginBottom: 12 }}>
              Flags: {blockingFlags.join(", ")}
            </div>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Override reason (required)"
              rows={3}
              style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, fontSize: 13, resize: "vertical", marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setOverrideOpen(false)} style={{ background: C.white, color: C.deep, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => { if (!overrideReason.trim()) return; doPublish(overrideReason.trim()); }}
                disabled={!overrideReason.trim() || publishing}
                style={{ background: C.amberFg, color: C.white, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (!overrideReason.trim() || publishing) ? 0.6 : 1 }}
              >
                {publishing ? "Publishing…" : "Publish with override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
