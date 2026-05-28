import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import SEO from "@/components/SEO";

import { classifyTrade, REGISTER_URLS, SCHEME_LABEL, type RegistrationScheme } from "@/lib/tradeBanding";

interface PendingTrade {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  company_name: string | null;
  trade_type: string | null;
  postcode: string | null;
  phone: string | null;
  verification_status: string | null;
  verified: boolean | null;
  submitted_for_review_at: string | null;
  created_at: string;
  insurance_expiry: string | null;
  trade_type_other: string | null;
  business_structure: string | null;
  companies_house_number: string | null;
  companies_house_status: string | null;
  companies_house_registered_name: string | null;
  companies_house_checked_at: string | null;
  band: string | null;
  verification_route: string | null;
  years_in_trade: number | null;
  assessor_name: string | null;
  assessment_notes: string | null;
  assessment_evidence_complete: boolean;
  references_called: boolean;
  site_assessment_done: boolean;
  competence_interview_done: boolean;
  gas_safe_number: string | null;
  cps_registration_number: string | null;
  mcs_number: string | null;
}

interface PortfolioItem {
  id: string;
  storage_path: string;
  area_or_address: string | null;
  approx_date: string | null;
  caption: string | null;
}

interface VerificationDoc {
  id: string;
  doc_type: string;
  file_path: string;
  original_filename: string | null;
  expiry_date: string | null;
  uploaded_at: string;
}

type ReferenceStatus = "not_contacted" | "contacted" | "verified" | "no_response";
type ReferenceRelationship = "past_customer" | "trade_contact" | "supplier" | "other";

interface TradeReference {
  id: string;
  trade_id: string | null;
  applicant_email: string | null;
  contact_name: string;
  relationship: ReferenceRelationship;
  phone: string | null;
  email: string | null;
  status: ReferenceStatus;
  admin_notes: string | null;
  status_updated_at: string | null;
  created_at: string;
}

const REFERENCE_STATUS_LABEL: Record<ReferenceStatus, string> = {
  not_contacted: "Not contacted",
  contacted: "Contacted",
  verified: "Verified",
  no_response: "No response",
};

const REFERENCE_RELATIONSHIP_LABEL: Record<ReferenceRelationship, string> = {
  past_customer: "Past customer",
  trade_contact: "Trade contact",
  supplier: "Supplier",
  other: "Other",
};


const STATUS_FILTERS = [
  { key: "pending", label: "Pending (legacy)" },
  { key: "pending_verification", label: "Pending verification" },
  { key: "pending_assessment", label: "Pending assessment" },
  { key: "info_requested", label: "Info requested" },
  { key: "approved", label: "Approved" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
] as const;

type FilterKey = typeof STATUS_FILTERS[number]["key"];

const LAUNCH_AREA_PREFIXES = ["NG", "DE", "LE"] as const;
const isInLaunchArea = (postcode: string | null) => {
  if (!postcode) return false;
  const p = postcode.trim().toUpperCase();
  return LAUNCH_AREA_PREFIXES.some((pre) => p.startsWith(pre));
};
const isInternalEmail = (email: string | null) =>
  !!email && email.toLowerCase().endsWith("@prografter.co.uk");

const AdminVerifications = () => {
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [sortMode, setSortMode] = useState<"wait" | "recent">("wait");
  const [trades, setTrades] = useState<PendingTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [references, setReferences] = useState<TradeReference[]>([]);
  const [refUpdating, setRefUpdating] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<Record<string, string>>({});

  const [working, setWorking] = useState(false);
  const [queryMessage, setQueryMessage] = useState("");
  const [queryOpen, setQueryOpen] = useState(false);
  const [matStats, setMatStats] = useState<{ withMaterials: number; total: number } | null>(null);
  const [supplierStats, setSupplierStats] = useState<{ total: number; new: number; contacted: number; qualified: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { count: total } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true });
      const { data: distinctRows } = await supabase
        .from("quote_materials")
        .select("quote_id");
      const withMaterials = new Set((distinctRows || []).map((r: any) => r.quote_id)).size;
      setMatStats({ withMaterials, total: total || 0 });

      const { data: supRows } = await supabase
        .from("supplier_interest")
        .select("status");
      const s = { total: 0, new: 0, contacted: 0, qualified: 0 };
      for (const r of (supRows as { status: string }[]) || []) {
        s.total++;
        if (r.status === "new") s.new++;
        else if (r.status === "contacted") s.contacted++;
        else if (r.status === "qualified") s.qualified++;
      }
      setSupplierStats(s);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select(
        "id,user_id,name,company_name,trade_type,trade_type_other,postcode,phone,verification_status,verified,submitted_for_review_at,created_at,insurance_expiry,business_structure,companies_house_number,companies_house_status,companies_house_registered_name,companies_house_checked_at,band,verification_route,years_in_trade,assessor_name,assessment_notes,assessment_evidence_complete,references_called,site_assessment_done,competence_interview_done,gas_safe_number,cps_registration_number,mcs_number"
      )
      .eq("verification_status", filter)
      .order("submitted_for_review_at", { ascending: true, nullsFirst: false })
      .limit(100);
    if (error) toast.error("Failed to load trades");
    const baseRows = (data as Omit<PendingTrade, "email">[]) || [];
    // Email lives on profiles, not trades — look up in batch.
    const userIds = baseRows.map((r) => r.user_id).filter(Boolean) as string[];
    let emailMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,email")
        .in("user_id", userIds);
      for (const p of (profs as { user_id: string; email: string }[]) || []) {
        emailMap[p.user_id] = p.email;
      }
    }
    setTrades(
      baseRows.map((r) => ({ ...r, email: r.user_id ? emailMap[r.user_id] || null : null }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

  const loadReferences = async (tradeId: string, applicantEmail: string | null) => {
    // References may be linked by trade_id (post-signup) or applicant_email (pre-signup).
    const orParts: string[] = [`trade_id.eq.${tradeId}`];
    if (applicantEmail) orParts.push(`applicant_email.eq.${applicantEmail.toLowerCase()}`);
    const { data, error } = await supabase
      .from("trade_references")
      .select("id,trade_id,applicant_email,contact_name,relationship,phone,email,status,admin_notes,status_updated_at,created_at")
      .or(orParts.join(","))
      .order("created_at", { ascending: true });
    if (error) {
      console.warn("loadReferences failed", error);
      setReferences([]);
      return;
    }
    setReferences((data as TradeReference[]) || []);
  };

  const openTrade = async (tradeId: string) => {
    setActiveId(tradeId);
    setDocs([]);
    setDocUrls({});
    setReferences([]);
    setPortfolio([]);
    setPortfolioUrls({});
    const trade = trades.find((t) => t.id === tradeId);
    const { data } = await supabase
      .from("trade_verification_documents")
      .select("id,doc_type,file_path,original_filename,expiry_date,uploaded_at")
      .eq("trade_id", tradeId)
      .order("uploaded_at", { ascending: true });
    const list = (data as VerificationDoc[]) || [];
    setDocs(list);
    // Generate signed URLs for inline preview
    const urls: Record<string, string> = {};
    for (const d of list) {
      const { data: signed } = await supabase.storage
        .from("trade-verification-documents")
        .createSignedUrl(d.file_path, 600);
      if (signed?.signedUrl) urls[d.id] = signed.signedUrl;
    }
    setDocUrls(urls);
    await loadReferences(tradeId, trade?.email || null);
    // Portfolio (time-served)
    const { data: pData } = await supabase
      .from("trade_portfolio_items")
      .select("id,storage_path,area_or_address,approx_date,caption")
      .eq("trade_id", tradeId)
      .order("created_at", { ascending: true });
    const pList = (pData as PortfolioItem[]) || [];
    setPortfolio(pList);
    const pUrls: Record<string, string> = {};
    for (const p of pList) {
      const { data: signed } = await supabase.storage
        .from("trade-verification-documents")
        .createSignedUrl(p.storage_path, 600);
      if (signed?.signedUrl) pUrls[p.id] = signed.signedUrl;
    }
    setPortfolioUrls(pUrls);
  };

  const updateChecklist = async (tradeId: string, field: string, value: boolean) => {
    const { error } = await supabase.from("trades").update({ [field]: value } as any).eq("id", tradeId);
    if (error) { toast.error(error.message); return; }
    setTrades(prev => prev.map(t => t.id === tradeId ? { ...t, [field]: value } as any : t));
  };


  const updateReferenceStatus = async (refId: string, status: ReferenceStatus) => {
    setRefUpdating(refId);
    const { error } = await supabase
      .from("trade_references")
      .update({ status })
      .eq("id", refId);
    if (error) {
      toast.error(error.message);
    } else {
      setReferences((prev) =>
        prev.map((r) => (r.id === refId ? { ...r, status, status_updated_at: new Date().toISOString() } : r)),
      );
      toast.success("Reference status updated");
    }
    setRefUpdating(null);
  };

  const updateReferenceNotes = async (refId: string, notes: string) => {
    const { error } = await supabase
      .from("trade_references")
      .update({ admin_notes: notes || null })
      .eq("id", refId);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReferences((prev) => prev.map((r) => (r.id === refId ? { ...r, admin_notes: notes || null } : r)));
  };

  const updateCompaniesHouseStatus = async (
    tradeId: string,
    status: "not_checked" | "verified" | "mismatch" | "n/a_sole_trader",
  ) => {
    const { error } = await supabase
      .from("trades")
      .update({ companies_house_status: status, companies_house_checked_at: new Date().toISOString() } as any)
      .eq("id", tradeId);
    if (error) { toast.error(error.message); return; }
    setTrades((prev) => prev.map((t) => (t.id === tradeId
      ? { ...t, companies_house_status: status, companies_house_checked_at: new Date().toISOString() }
      : t)));
    toast.success("Companies House status updated");
  };




  const sendVerifiedEmail = async (trade: PendingTrade) => {
    if (!trade.email) return;
    const firstName = (trade.name || "").trim().split(/\s+/)[0] || "";
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "trade-verified",
          recipientEmail: trade.email,
          idempotencyKey: `trade-verified-${trade.id}`,
          templateData: { firstName },
        },
      });
    } catch (e) {
      console.warn("trade-verified email failed", e);
    }
  };

  const sendQueryEmail = async (trade: PendingTrade, message: string) => {
    if (!trade.email) return;
    const firstName = (trade.name || "").trim().split(/\s+/)[0] || "";
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "trade-verification-query",
          recipientEmail: trade.email,
          idempotencyKey: `trade-query-${trade.id}-${Date.now()}`,
          templateData: { firstName, message },
        },
      });
    } catch (e) {
      console.warn("trade-verification-query email failed", e);
    }
  };

  const approve = async (trade: PendingTrade) => {
    setWorking(true);
    // Time-served goes through the RPC which enforces the 4-item checklist.
    if (trade.verification_route === "time_served") {
      const { error } = await supabase.rpc("admin_approve_trade", { _trade_id: trade.id } as any);
      if (error) { toast.error(error.message); setWorking(false); return; }
    } else {
      const { error } = await supabase
        .from("trades")
        .update({ verified: true, verification_status: "verified" } as any)
        .eq("id", trade.id);
      if (error) { toast.error(error.message); setWorking(false); return; }
    }
    await sendVerifiedEmail(trade);
    toast.success(`${trade.company_name || trade.name} approved — email sent`);
    setActiveId(null);
    setWorking(false);
    load();
  };

  const sendRejectedEmail = async (trade: PendingTrade, reason: string) => {
    if (!trade.email) return;
    const firstName = (trade.name || "").trim().split(/\s+/)[0] || "";
    try {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "trade-rejected",
          recipientEmail: trade.email,
          idempotencyKey: `trade-rejected-${trade.id}`,
          templateData: { firstName, reason },
        },
      });
    } catch (e) {
      console.warn("trade-rejected email failed", e);
    }
  };

  const reject = async (trade: PendingTrade) => {
    const reason = window.prompt(
      "Optional reason to share with the applicant (leave blank to send a generic decline):",
      ""
    );
    if (reason === null) return; // cancelled
    setWorking(true);
    const { error } = await supabase
      .from("trades")
      .update({
        verified: false,
        verification_status: "rejected",
        verification_notes: reason.trim() || null,
      } as any)
      .eq("id", trade.id);
    if (error) {
      toast.error(error.message);
      setWorking(false);
      return;
    }
    await sendRejectedEmail(trade, reason.trim());
    toast.success("Rejected — applicant notified");
    setActiveId(null);
    setWorking(false);
    load();
  };

  const requestInfo = async (trade: PendingTrade) => {
    if (!queryMessage.trim()) {
      toast.error("Write a message first");
      return;
    }
    setWorking(true);
    const { error } = await supabase
      .from("trades")
      .update({
        verification_status: "info_requested",
        verification_notes: queryMessage.trim(),
      } as any)
      .eq("id", trade.id);
    if (error) {
      toast.error(error.message);
      setWorking(false);
      return;
    }
    await sendQueryEmail(trade, queryMessage.trim());
    toast.success("Info request emailed to trade");
    setQueryOpen(false);
    setQueryMessage("");
    setActiveId(null);
    setWorking(false);
    load();
  };

  const activeTrade = trades.find((t) => t.id === activeId) || null;

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Trade Verifications — Admin" description="Admin review of pending trade verification applications." path="/admin/verifications" />
      <header className="border-b border-navy/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl text-navy">
            Pro<span className="text-teal">Grafter</span>
            <span className="ml-3 text-xs font-mono uppercase tracking-widest text-secondary-text">
              admin
            </span>
          </Link>
          <nav className="flex gap-4 font-mono text-xs uppercase tracking-widest">
            <Link to="/admin/verifications" className="text-teal underline">Verifications</Link>
            <Link to="/admin/suppliers" className="text-navy hover:text-teal">Suppliers</Link>
            <Link to="/admin/email-status" className="text-navy hover:text-teal">Email status →</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-heading text-navy text-4xl mb-2">Trade Verifications</h1>
        <p className="font-body text-secondary-text mb-3">
          Review applications and approve, reject, or request more information.
        </p>
        <div className="bg-teal/5 border border-teal/20 rounded-xl p-3 mb-6 text-sm text-navy/80 flex flex-wrap items-center gap-x-2 gap-y-1">
          <strong className="text-teal">Pre-submission queue.</strong>
          <span>Trades who started signup but haven't completed document upload appear here. For submitted 6-step applications in active vetting, use the</span>
          <Link to="/vetting" className="text-teal underline font-semibold">Vetting Dashboard →</Link>
        </div>

        {matStats && (
          <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-6 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary-text">
              Structured materials coverage
            </span>
            <span className="font-heading text-2xl text-navy">
              {matStats.total === 0
                ? "0%"
                : `${Math.round((matStats.withMaterials / matStats.total) * 100)}%`}
            </span>
            <span className="font-mono text-xs text-secondary-text">
              {matStats.withMaterials} of {matStats.total} quotes have materials data
            </span>
          </div>
        )}

        {supplierStats && (
          <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-6 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary-text">
              Supplier registrations
            </span>
            <span className="font-heading text-2xl text-navy">{supplierStats.total}</span>
            <span className="font-mono text-xs text-secondary-text">
              new: {supplierStats.new} · contacted: {supplierStats.contacted} · qualified: {supplierStats.qualified}
            </span>
            <Link
              to="/admin/suppliers"
              className="ml-auto font-mono text-xs uppercase tracking-widest text-teal hover:underline"
            >
              Open queue →
            </Link>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-colors ${
                filter === f.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-navy border-navy/10 hover:bg-navy/5"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filter === "pending" && (() => {
          const awaitingCount = trades.filter((t) => !t.submitted_for_review_at).length;
          const readyCount = trades.length - awaitingCount;
          return (
            <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs text-secondary-text">
                <span className="text-amber-700 font-semibold">{awaitingCount}</span>{" "}
                trades awaiting document submission
                <span className="mx-2 text-navy/30">|</span>
                <span className="text-blue-700 font-semibold">{readyCount}</span>{" "}
                trades ready for review
              </p>
              <label className="font-mono text-[10px] uppercase tracking-wider text-secondary-text flex items-center gap-2">
                Sort:
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as "wait" | "recent")}
                  className="border border-navy/10 rounded-md px-2 py-1 text-navy text-xs"
                >
                  <option value="wait">Longest wait first</option>
                  <option value="recent">Most recent first</option>
                </select>
              </label>
            </div>
          );
        })()}

        {loading ? (
          <p className="font-mono text-sm text-secondary-text">Loading…</p>
        ) : trades.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-navy/10">
            <p className="font-body text-secondary-text">No trades in this state.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...trades]
              .sort((a, b) => {
                const ta = new Date(a.created_at).getTime();
                const tb = new Date(b.created_at).getTime();
                return sortMode === "wait" ? ta - tb : tb - ta;
              })
              .map((t) => {
              const submitted = t.submitted_for_review_at;
              const daysAgo = Math.floor(
                (Date.now() - new Date(t.created_at).getTime()) / 86_400_000,
              );
              const awaitingSubmit = !submitted;
              const internal = isInternalEmail(t.email);
              const outOfArea = !!t.postcode && !isInLaunchArea(t.postcode);
              const nudgeEligible = awaitingSubmit && daysAgo >= 7;
              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-2xl border p-4 md:p-5 ${
                    awaitingSubmit ? "border-amber-200 bg-amber-50/40" : "border-navy/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-heading text-lg text-navy leading-tight flex items-center gap-2 flex-wrap">
                        {t.company_name || t.name || "Unnamed trade"}
                        {internal && (
                          <Badge className="bg-purple-100 text-purple-700 font-mono text-[10px] uppercase">
                            Internal
                          </Badge>
                        )}
                        {outOfArea && (
                          <Badge className="bg-orange-100 text-orange-700 font-mono text-[10px] uppercase">
                            Out of area
                          </Badge>
                        )}
                      </div>
                      {t.company_name && t.name && t.name !== t.company_name && (
                        <div className="font-body text-sm text-body-text">{t.name}</div>
                      )}
                      {outOfArea && (
                        <p className="font-mono text-[11px] text-orange-700 mt-1">
                          Beta launch covers East Midlands only (NG / DE / LE).
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className="bg-navy/10 text-navy">
                          {t.trade_type === "Other" && t.trade_type_other
                            ? `Other: ${t.trade_type_other}`
                            : t.trade_type || "Trade type missing"}
                        </Badge>
                        {t.postcode && (
                          <Badge className="bg-navy/10 text-navy font-mono">
                            {t.postcode}
                          </Badge>
                        )}
                        {awaitingSubmit ? (
                          <Badge className={daysAgo >= 7 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                            Awaiting submit · {daysAgo}d
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700">
                            Submitted {format(new Date(submitted!), "dd MMM")}
                          </Badge>
                        )}
                        {t.insurance_expiry ? (
                          <Badge className="bg-green-100 text-green-700 font-mono">
                            Insurance to {format(new Date(t.insurance_expiry), "dd MMM yy")}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">No insurance</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {t.email ? (
                      <a
                        href={`mailto:${t.email}`}
                        className="font-mono text-xs text-teal hover:underline break-all"
                      >
                        ✉ {t.email}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-secondary-text">
                        ✉ no email on file
                      </span>
                    )}
                    {t.phone ? (
                      <a
                        href={`tel:${t.phone.replace(/\s+/g, "")}`}
                        className="font-mono text-xs text-teal hover:underline"
                      >
                        ☎ {t.phone}
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-secondary-text">
                        ☎ no phone on file
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {awaitingSubmit ? (
                      <span className="font-mono text-[11px] uppercase tracking-wider text-amber-700 self-center px-2">
                        Cannot review until trade submits documents
                      </span>
                    ) : (
                      <button
                        onClick={() => openTrade(t.id)}
                        className="bg-navy text-white font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-navy/90"
                      >
                        Review documents →
                      </button>
                    )}
                    {t.email && nudgeEligible && (
                      <a
                        href={`mailto:${t.email}?subject=${encodeURIComponent(
                          "Finish your ProGrafter application",
                        )}&body=${encodeURIComponent(
                          `Hi ${(t.name || "").split(/\s+/)[0] || "there"},\n\nThanks for signing up to ProGrafter ${daysAgo} days ago. We noticed your verification application isn't quite finished yet — to start receiving job leads, please log in and complete the remaining steps (typically: upload your public liability insurance certificate and confirm your trade details):\n\nhttps://prografter.co.uk/apply\n\n${outOfArea ? "Heads up — we're currently in beta in the East Midlands (NG / DE / LE postcodes). We'll be in touch when we expand to your area.\n\n" : ""}If you've hit a snag or need a hand, just reply to this email.\n\nThanks,\nThe ProGrafter team`,
                        )}`}
                        className="bg-amber-500 text-white font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-amber-600"
                      >
                        Nudge to finish
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>


      {/* Drawer / Modal */}
      {activeTrade && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
          onClick={() => setActiveId(null)}
        >
          <div
            className="bg-white w-full md:max-w-2xl md:rounded-2xl shadow-xl max-h-[92vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-navy/10 flex items-start justify-between">
              <div>
                <h2 className="font-heading text-2xl text-navy">
                  {activeTrade.company_name || activeTrade.name}
                </h2>
                <p className="font-mono text-xs text-secondary-text mt-1">
                  {activeTrade.email} · {activeTrade.phone}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge className="bg-navy/10 text-navy">
                    {activeTrade.trade_type}
                  </Badge>
                  <Badge className="bg-navy/10 text-navy">
                    {activeTrade.postcode}
                  </Badge>
                  <Badge
                    className={
                      activeTrade.verification_status === "approved"
                        ? "bg-green-100 text-green-700"
                        : activeTrade.verification_status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : activeTrade.verification_status === "info_requested"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }
                  >
                    {activeTrade.verification_status || "—"}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setActiveId(null)}
                className="font-mono text-xs uppercase text-secondary-text hover:text-navy"
              >
                Close
              </button>
            </div>

            <div className="px-6 py-5 border-b border-navy/10">
              <h3 className="font-mono text-xs uppercase tracking-wider text-secondary-text mb-3">
                Company Registration
              </h3>
              {(() => {
                const bs = activeTrade.business_structure;
                const bsLabel = bs === "sole_trader" ? "Sole trader"
                  : bs === "limited_company" ? "Limited company"
                  : bs === "partnership" ? "Partnership"
                  : "Not provided";
                const chs = (activeTrade.companies_house_status || "not_checked") as
                  "not_checked" | "verified" | "mismatch" | "n/a_sole_trader";
                const ch = activeTrade.companies_house_number;
                const registerUrl = ch
                  ? `https://find-and-update.company-information.service.gov.uk/company/${encodeURIComponent(ch)}`
                  : null;
                const statusClass =
                  chs === "verified" ? "bg-green-100 text-green-700"
                  : chs === "mismatch" ? "bg-red-100 text-red-700"
                  : chs === "n/a_sole_trader" ? "bg-navy/10 text-navy"
                  : "bg-amber-100 text-amber-700";
                const statusLabel: Record<typeof chs, string> = {
                  not_checked: "Not checked",
                  verified: "Verified",
                  mismatch: "Mismatch — review",
                  "n/a_sole_trader": "N/A (sole trader)",
                };
                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3 items-center">
                      <Badge className="bg-navy/10 text-navy">{bsLabel}</Badge>
                      <Badge className={statusClass}>{statusLabel[chs]}</Badge>
                      {activeTrade.companies_house_checked_at && (
                        <span className="font-mono text-[11px] text-secondary-text">
                          checked {format(new Date(activeTrade.companies_house_checked_at), "dd MMM yyyy HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="font-body text-sm text-navy">
                      <span className="font-mono text-xs uppercase text-secondary-text mr-2">CH no:</span>
                      {ch ? (
                        <>
                          <span className="font-mono">{ch}</span>
                          {registerUrl && (
                            <a
                              href={registerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-3 font-mono text-xs uppercase tracking-wider text-teal hover:underline"
                            >
                              View on register ↗
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-secondary-text">—</span>
                      )}
                    </div>
                    {activeTrade.companies_house_registered_name && (
                      <div className="font-body text-sm text-navy">
                        <span className="font-mono text-xs uppercase text-secondary-text mr-2">Registered name:</span>
                        {activeTrade.companies_house_registered_name}
                        {activeTrade.company_name
                          && activeTrade.company_name.trim().toLowerCase()
                             !== activeTrade.companies_house_registered_name.trim().toLowerCase() && (
                          <span className="ml-2 text-xs text-red-600 font-mono uppercase">
                            ≠ {activeTrade.company_name}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <label className="font-mono text-xs uppercase text-secondary-text">Status:</label>
                      <select
                        value={chs}
                        onChange={(e) => updateCompaniesHouseStatus(activeTrade.id, e.target.value as any)}
                        className="border border-navy/15 rounded-lg px-2 py-1.5 text-xs font-mono uppercase text-navy bg-white focus:outline-none focus:border-teal"
                      >
                        <option value="not_checked">Not checked</option>
                        <option value="verified">Verified</option>
                        <option value="mismatch">Mismatch</option>
                        <option value="n/a_sole_trader">N/A (sole trader)</option>
                      </select>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Route-aware verification panel */}
            <div className="px-6 py-5 border-b border-navy/10">
              {(() => {
                const cfg = classifyTrade(activeTrade.trade_type);
                const route = activeTrade.verification_route || (cfg.band === "competence_assessed" ? "—" : "registered");
                const number = activeTrade.gas_safe_number || activeTrade.cps_registration_number || activeTrade.mcs_number || "";
                return (
                  <>
                    <h3 className="font-mono text-xs uppercase tracking-wider text-secondary-text mb-3">
                      Band & route
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-navy/10 text-navy">Band: {cfg.band}</Badge>
                      <Badge className="bg-teal/10 text-teal">Route: {route}</Badge>
                      {activeTrade.years_in_trade != null && (
                        <Badge className="bg-navy/10 text-navy font-mono">{activeTrade.years_in_trade}y in trade</Badge>
                      )}
                    </div>
                    {cfg.required && cfg.required.length > 0 && (
                      <div className="text-sm space-y-1 mb-3">
                        <div className="font-mono text-xs uppercase text-secondary-text">Public register check (one click):</div>
                        <div className="flex flex-wrap gap-2">
                          {cfg.required.map((scheme) => (
                            <a
                              key={scheme}
                              href={REGISTER_URLS[scheme as RegistrationScheme](number || "")}
                              target="_blank" rel="noopener noreferrer"
                              className="font-mono text-xs uppercase tracking-wider text-teal underline"
                            >
                              {SCHEME_LABEL[scheme as RegistrationScheme]} ↗
                            </a>
                          ))}
                        </div>
                        <div className="font-mono text-xs text-secondary-text">Number on file: {number || "—"}</div>
                      </div>
                    )}

                    {activeTrade.verification_route === "time_served" && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                        <div className="font-mono text-xs uppercase text-amber-800 mb-1">Time-served checklist — all 4 required to approve</div>
                        {[
                          ["assessment_evidence_complete", "Evidence reviewed (portfolio + years)"],
                          ["references_called", "Both references called"],
                          ["site_assessment_done", "Site / work assessment done"],
                          ["competence_interview_done", "Competence interview done"],
                        ].map(([field, label]) => (
                          <label key={field} className="flex items-center gap-2 text-sm text-navy">
                            <input
                              type="checkbox"
                              checked={!!(activeTrade as any)[field]}
                              onChange={(e) => updateChecklist(activeTrade.id, field, e.target.checked)}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    )}

                    {portfolio.length > 0 && (
                      <div className="mt-4">
                        <div className="font-mono text-xs uppercase text-secondary-text mb-2">Portfolio ({portfolio.length})</div>
                        <div className="grid grid-cols-3 gap-2">
                          {portfolio.map((p) => (
                            <a key={p.id} href={portfolioUrls[p.id]} target="_blank" rel="noopener noreferrer"
                               className="block border border-navy/10 rounded-lg overflow-hidden hover:border-teal">
                              {portfolioUrls[p.id]
                                ? <img src={portfolioUrls[p.id]} alt={p.caption || "portfolio"} className="w-full h-24 object-cover" />
                                : <div className="h-24 bg-navy/5" />}
                              <div className="p-1 text-[10px] font-mono text-secondary-text truncate">
                                {p.area_or_address || "—"}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>


              <h3 className="font-mono text-xs uppercase tracking-wider text-secondary-text mb-3">
                Documents ({docs.length})
              </h3>
              {docs.length === 0 ? (
                <p className="font-body text-sm text-secondary-text">
                  No documents uploaded.
                </p>
              ) : (
                <div className="space-y-3">
                  {docs.map((d) => (
                    <div
                      key={d.id}
                      className="border border-navy/10 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-xs uppercase text-teal">
                          {d.doc_type}
                        </div>
                        <div className="font-body text-sm text-navy truncate">
                          {d.original_filename}
                        </div>
                        {d.expiry_date && (
                          <div className="font-mono text-xs text-secondary-text">
                            expires {format(new Date(d.expiry_date), "dd MMM yyyy")}
                          </div>
                        )}
                      </div>
                      {docUrls[d.id] && (
                        <a
                          href={docUrls[d.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs uppercase tracking-wider text-teal hover:underline whitespace-nowrap"
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* References */}
              <div className="mt-8">
                <h3 className="font-mono text-xs uppercase tracking-wider text-secondary-text mb-3">
                  References ({references.length})
                </h3>
                {references.length === 0 ? (
                  <p className="font-body text-sm text-secondary-text">
                    No references submitted.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {references.map((r) => (
                      <div
                        key={r.id}
                        className="border border-navy/10 rounded-xl p-3"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="font-body text-sm text-navy font-semibold">
                              {r.contact_name}
                            </div>
                            <div className="font-mono text-xs uppercase text-teal">
                              {REFERENCE_RELATIONSHIP_LABEL[r.relationship]}
                            </div>
                            <div className="font-body text-sm text-secondary-text mt-1 space-x-3">
                              {r.phone && <span>📞 {r.phone}</span>}
                              {r.email && <span>✉️ {r.email}</span>}
                            </div>
                            {r.status_updated_at && (
                              <div className="font-mono text-[11px] text-secondary-text mt-1">
                                last updated {format(new Date(r.status_updated_at), "dd MMM yyyy HH:mm")}
                              </div>
                            )}
                          </div>
                          <select
                            value={r.status}
                            disabled={refUpdating === r.id}
                            onChange={(e) => updateReferenceStatus(r.id, e.target.value as ReferenceStatus)}
                            className="border border-navy/15 rounded-lg px-2 py-1.5 text-xs font-mono uppercase text-navy bg-white focus:outline-none focus:border-teal"
                          >
                            {(Object.keys(REFERENCE_STATUS_LABEL) as ReferenceStatus[]).map((s) => (
                              <option key={s} value={s}>{REFERENCE_STATUS_LABEL[s]}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          defaultValue={r.admin_notes || ""}
                          placeholder="Call notes (saved when you click out)…"
                          onBlur={(e) => {
                            if ((e.target.value || "") !== (r.admin_notes || "")) {
                              updateReferenceNotes(r.id, e.target.value);
                            }
                          }}
                          rows={2}
                          className="mt-3 w-full border border-navy/10 rounded-lg p-2 font-body text-xs focus:outline-none focus:border-teal"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}

              {activeTrade.verification_status !== "approved" && (
                <div className="mt-6 pt-5 border-t border-navy/10">
                  {!queryOpen ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => approve(activeTrade)}
                        disabled={working}
                        className="bg-teal text-white font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-teal-hover disabled:opacity-50"
                      >
                        {working ? "Working…" : "Approve"}
                      </button>
                      <button
                        onClick={() => setQueryOpen(true)}
                        disabled={working}
                        className="bg-amber-500 text-white font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50"
                      >
                        Request more info
                      </button>
                      <button
                        onClick={() => reject(activeTrade)}
                        disabled={working}
                        className="bg-white border border-red-300 text-red-600 font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block font-mono text-xs uppercase tracking-wider text-secondary-text">
                        Message to the trade
                      </label>
                      <textarea
                        value={queryMessage}
                        onChange={(e) => setQueryMessage(e.target.value)}
                        rows={4}
                        placeholder="e.g. Could you upload a clearer photo of your insurance certificate?"
                        className="w-full border border-navy/10 rounded-xl p-3 font-body text-sm focus:outline-none focus:border-teal"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => requestInfo(activeTrade)}
                          disabled={working}
                          className="bg-teal text-white font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-teal-hover disabled:opacity-50"
                        >
                          {working ? "Sending…" : "Send query"}
                        </button>
                        <button
                          onClick={() => { setQueryOpen(false); setQueryMessage(""); }}
                          className="bg-white border border-navy/10 text-navy font-mono text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-navy/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
