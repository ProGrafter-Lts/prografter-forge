import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import SEO from "@/components/SEO";

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
}

interface VerificationDoc {
  id: string;
  doc_type: string;
  file_path: string;
  original_filename: string | null;
  expiry_date: string | null;
  uploaded_at: string;
}

const STATUS_FILTERS = [
  { key: "pending", label: "Pending review" },
  { key: "info_requested", label: "Info requested" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type FilterKey = typeof STATUS_FILTERS[number]["key"];

const AdminVerifications = () => {
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [trades, setTrades] = useState<PendingTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [working, setWorking] = useState(false);
  const [queryMessage, setQueryMessage] = useState("");
  const [queryOpen, setQueryOpen] = useState(false);
  const [materialsMetric, setMaterialsMetric] = useState<{
    quotesWithMaterials: number;
    totalQuotes: number;
    avgLines: number;
    avgValue: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { count: totalQuotes } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true });
      const { data: mats } = await supabase
        .from("quote_materials")
        .select("quote_id, line_total_ex_vat");
      const grouped = new Map<string, { lines: number; value: number }>();
      (mats || []).forEach((m: any) => {
        const g = grouped.get(m.quote_id) || { lines: 0, value: 0 };
        g.lines += 1;
        g.value += Number(m.line_total_ex_vat) || 0;
        grouped.set(m.quote_id, g);
      });
      const quotesWithMaterials = grouped.size;
      const totalLines = Array.from(grouped.values()).reduce((s, g) => s + g.lines, 0);
      const totalValue = Array.from(grouped.values()).reduce((s, g) => s + g.value, 0);
      setMaterialsMetric({
        quotesWithMaterials,
        totalQuotes: totalQuotes || 0,
        avgLines: quotesWithMaterials ? totalLines / quotesWithMaterials : 0,
        avgValue: quotesWithMaterials ? totalValue / quotesWithMaterials : 0,
      });
    })();
  }, []);


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select(
        "id,user_id,name,company_name,trade_type,postcode,phone,verification_status,verified,submitted_for_review_at,created_at,insurance_expiry"
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

  const openTrade = async (tradeId: string) => {
    setActiveId(tradeId);
    setDocs([]);
    setDocUrls({});
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
    const { error } = await supabase
      .from("trades")
      .update({ verified: true, verification_status: "approved" } as any)
      .eq("id", trade.id);
    if (error) {
      toast.error(error.message);
      setWorking(false);
      return;
    }
    await sendVerifiedEmail(trade);
    toast.success(`${trade.company_name || trade.name} approved — email sent`);
    setActiveId(null);
    setWorking(false);
    load();
  };

  const reject = async (trade: PendingTrade) => {
    setWorking(true);
    const { error } = await supabase
      .from("trades")
      .update({ verified: false, verification_status: "rejected" } as any)
      .eq("id", trade.id);
    if (error) {
      toast.error(error.message);
      setWorking(false);
      return;
    }
    toast.success("Rejected");
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
          <Link
            to="/admin/email-status"
            className="font-mono text-xs uppercase tracking-widest text-teal hover:underline"
          >
            Email status →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-heading text-navy text-4xl mb-2">Trade Verifications</h1>
        <p className="font-body text-secondary-text mb-6">
          Review applications and approve, reject, or request more information.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
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

        {loading ? (
          <p className="font-mono text-sm text-secondary-text">Loading…</p>
        ) : trades.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-navy/10">
            <p className="font-body text-secondary-text">No trades in this state.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-navy/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-navy/5">
                <tr className="text-left font-mono text-xs uppercase tracking-wider text-secondary-text">
                  <th className="px-4 py-3">Trade</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Postcode</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Insurance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-t border-navy/5 hover:bg-cream/40">
                    <td className="px-4 py-3">
                      <div className="font-body text-navy font-medium">
                        {t.company_name || t.name}
                      </div>
                      <div className="font-mono text-xs text-secondary-text">
                        {t.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-body-text">
                      {t.trade_type || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-body-text">
                      {t.postcode || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-secondary-text">
                      {t.submitted_for_review_at
                        ? format(new Date(t.submitted_for_review_at), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {t.insurance_expiry ? (
                        <span className="font-mono text-xs text-body-text">
                          exp {format(new Date(t.insurance_expiry), "dd MMM yyyy")}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-red-600">missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openTrade(t.id)}
                        className="font-mono text-xs uppercase tracking-wider text-teal hover:underline"
                      >
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

            <div className="px-6 py-5">
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
