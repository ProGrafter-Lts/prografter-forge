import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ShieldCheck, Lock, Snowflake } from "lucide-react";
import InspectionPanel, { type InspectionReport } from "@/components/wallet/InspectionPanel";

type WalletStage = {
  id: string;
  stage_name: string;
  stage_order: number;
  is_mobilization: boolean;
  expected_amount_pence: number;
  funded_amount_pence: number;
  released_amount_pence: number;
  funding_status: string;
  awaiting_funds: boolean;
  deposit_requested_at: string | null;
  inspection_status: string | null;
  release_block_reason: string | null;
};

type Wallet = {
  id: string;
  job_id: string;
  homeowner_id: string;
  trade_id: string;
  booked_start_date: string | null;
  mobilization_target_request_date: string | null;
  mobilization_hard_deadline: string | null;
  start_date_at_risk: boolean;
  frozen: boolean;
  frozen_reason: string | null;
  final_stage_pct: number | null;
  final_stage_warning: boolean;
};

type DrawdownRequest = {
  id: string;
  amount_pence: number;
  description: string;
  status: string;
  created_at: string;
  decided_at: string | null;
  decline_reason: string | null;
  stripe_transfer_id: string | null;
  wallet_stage_id: string;
};

type AuditEvent = {
  id: string;
  event_type: string;
  actor_role: string | null;
  created_at: string;
  detail: Record<string, unknown>;
};

const money = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_LABEL: Record<string, string> = {
  expected: "Expected — not yet funded",
  deposit_requested: "Deposit requested",
  funded: "Funded",
  released: "Released",
};

const ProjectWallet = () => {
  const { id: jobId } = useParams();
  const [role, setRole] = useState<"homeowner" | "trade" | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [stages, setStages] = useState<WalletStage[]>([]);
  const [requests, setRequests] = useState<DrawdownRequest[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Trade request form
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data: walletRow } = await supabase
      .from("project_wallets")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();

    if (!walletRow) {
      setWallet(null);
      setLoading(false);
      return;
    }
    setWallet(walletRow as Wallet);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    const [{ data: ho }, { data: tr }] = await Promise.all([
      supabase.from("homeowners").select("id").eq("id", walletRow.homeowner_id).eq("user_id", uid ?? "").maybeSingle(),
      supabase.from("trades").select("id").eq("id", walletRow.trade_id).eq("user_id", uid ?? "").maybeSingle(),
    ]);
    setRole(ho ? "homeowner" : tr ? "trade" : null);

    const [stageRes, reqRes, auditRes, reportRes] = await Promise.all([
      supabase.from("project_wallet_stages").select("*").eq("wallet_id", walletRow.id).order("stage_order"),
      supabase.from("drawdown_requests").select("id, amount_pence, description, status, created_at, decided_at, decline_reason, stripe_transfer_id, wallet_stage_id").eq("wallet_id", walletRow.id).order("created_at", { ascending: false }),
      supabase.from("drawdown_audit_events").select("id, event_type, actor_role, created_at, detail").eq("wallet_id", walletRow.id).order("created_at", { ascending: false }),
      supabase.from("stage_inspection_reports").select("*").eq("wallet_id", walletRow.id).order("created_at", { ascending: false }),
    ]);

    setStages((stageRes.data ?? []) as WalletStage[]);
    setRequests((reqRes.data ?? []) as DrawdownRequest[]);
    setAudit((auditRes.data ?? []) as AuditEvent[]);
    setReports((reportRes.data ?? []) as unknown as InspectionReport[]);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { void load(); }, [load]);

  const mobilization = useMemo(() => stages.find((s) => s.is_mobilization) ?? null, [stages]);

  const availablePence = useMemo(() => {
    if (!mobilization) return 0;
    const pending = requests
      .filter((r) => r.wallet_stage_id === mobilization.id && r.status === "pending_approval")
      .reduce((s, r) => s + r.amount_pence, 0);
    return Math.max(mobilization.funded_amount_pence - mobilization.released_amount_pence - pending, 0);
  }, [mobilization, requests]);

  const submitRequest = async () => {
    if (!mobilization || !wallet) return;
    const pence = Math.round(Number(amount) * 100);
    if (!Number.isFinite(pence) || pence <= 0) return toast.error("Enter a valid amount");
    if (description.trim().length < 3) return toast.error("Add a description");
    if (!file) return toast.error("Attach the proforma invoice");
    if (pence > availablePence) return toast.error("Amount exceeds the funded balance for this stage");

    setBusy(true);
    try {
      const path = `${wallet.trade_id}/${wallet.job_id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("drawdown-proformas").upload(path, file);
      if (upErr) throw upErr;

      const { data, error } = await supabase.functions.invoke("create-drawdown-request", {
        body: {
          wallet_stage_id: mobilization.id,
          amount_pence: pence,
          description: description.trim(),
          proforma_path: path,
          proforma_filename: file.name,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(JSON.stringify((data as any).error));

      toast.success("Drawdown request sent for approval");
      setAmount(""); setDescription(""); setFile(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create request");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (requestId: string, decision: "approve" | "decline") => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("decide-drawdown-request", {
        body: { request_id: requestId, decision },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(String((data as any).error));
      toast.success(decision === "approve" ? "Approved — funds released" : "Request declined");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record your decision");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-sm text-secondary-text">Loading wallet…</div>;
  }

  if (!wallet) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center font-mono text-sm text-secondary-text">
        No project wallet has been set up for this project yet.
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending_approval");

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <header>
          <h1 className="font-heading text-navy text-3xl">Project wallet</h1>
          <p className="font-mono text-sm text-secondary-text mt-1">
            Rolling stage-by-stage funding. Money only moves when you approve it.
          </p>
        </header>

        {wallet.frozen && (
          <div className="rounded-2xl border border-sky-300 bg-sky-50 p-4 flex gap-3">
            <Snowflake className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <p className="font-mono text-sm text-sky-900 font-semibold">Project frozen</p>
              <p className="font-mono text-xs text-sky-800 mt-1">
                {wallet.frozen_reason ?? "A disputed inspection report has frozen this project."} No payments move and no
                further stage funding is requested until an admin lifts the freeze.
              </p>
            </div>
          </div>
        )}

        {wallet.final_stage_warning && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-mono text-sm text-amber-900 font-semibold">Final payment sizing</p>
              <p className="font-mono text-xs text-amber-800 mt-1">
                The final stage is {Number(wallet.final_stage_pct ?? 0).toFixed(1)}% of contract value, above the 5% guide.
                Confirm this is intended before the schedule is agreed.
              </p>
            </div>
          </div>
        )}

        {wallet.start_date_at_risk && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-mono text-sm text-amber-900 font-semibold">Start date at risk</p>
              <p className="font-mono text-xs text-amber-800 mt-1">
                Mobilization wasn't funded by the deadline. Nothing has been rebooked — the trade decides the new date.
              </p>
            </div>
          </div>
        )}

        {/* Mobilization timeline */}
        <section className="rounded-2xl border border-navy/10 bg-card p-5 space-y-2">
          <h2 className="font-heading text-navy text-xl">Mobilization timeline</h2>
          <div className="grid grid-cols-3 gap-3 font-mono text-xs text-secondary-text">
            <div><p className="text-navy/50">Requested by</p><p>{wallet.mobilization_target_request_date ?? "—"}</p></div>
            <div><p className="text-navy/50">Hard deadline</p><p>{wallet.mobilization_hard_deadline ?? "—"}</p></div>
            <div><p className="text-navy/50">Booked start</p><p>{wallet.booked_start_date ?? "—"}</p></div>
          </div>
        </section>

        {/* Stages */}
        <section className="space-y-3">
          <h2 className="font-heading text-navy text-xl">Stage funding</h2>
          <div className="rounded-2xl border border-navy/10 bg-card divide-y divide-navy/5">
            {stages.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-navy font-semibold">
                    {s.stage_name}{s.is_mobilization && " · Mobilization"}
                  </p>
                  <p className="font-mono text-xs text-secondary-text">
                    Expected {money(s.expected_amount_pence)} · Funded {money(s.funded_amount_pence)} · Released {money(s.released_amount_pence)}
                  </p>
                  {s.awaiting_funds && (
                    <p className="font-mono text-xs text-amber-700 mt-1">Inspection passed — awaiting funds</p>
                  )}
                  {s.inspection_status && (
                    <p className="font-mono text-xs text-secondary-text mt-1">Inspection: {s.inspection_status}</p>
                  )}
                  {s.release_block_reason && s.funding_status !== "released" && (
                    <p className="font-mono text-xs text-secondary-text mt-1">{s.release_block_reason}</p>
                  )}
                </div>
                <Badge variant="secondary" className="font-mono text-xs shrink-0">
                  {STATUS_LABEL[s.funding_status] ?? s.funding_status}
                </Badge>
              </div>
            ))}
            {stages.length === 0 && (
              <p className="p-4 font-mono text-sm text-secondary-text">No stages configured yet.</p>
            )}
          </div>
        </section>

        {/* Trade: raise a drawdown */}
        {role === "trade" && mobilization && (
          <section className="rounded-2xl border border-navy/10 bg-card p-5 space-y-3">
            <h2 className="font-heading text-navy text-xl">Request a mobilization drawdown</h2>
            <p className="font-mono text-xs text-secondary-text">
              Available to draw: <strong>{money(availablePence)}</strong>. Your proforma is stored privately and is never shown to the homeowner.
            </p>
            <Input
              type="number" min="0" step="0.01" placeholder="Amount (£)"
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
            <Textarea
              placeholder="What this covers (the homeowner sees this)"
              value={description} onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              type="file" accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={submitRequest} disabled={busy}>Send for approval</Button>
          </section>
        )}

        {/* Homeowner: approvals */}
        {role === "homeowner" && (
          <section className="space-y-3">
            <h2 className="font-heading text-navy text-xl">Awaiting your approval</h2>
            {pending.length === 0 ? (
              <p className="font-mono text-sm text-secondary-text">Nothing needs your approval right now.</p>
            ) : (
              pending.map((r) => (
                <div key={r.id} className="rounded-2xl border border-navy/10 bg-card p-5 space-y-3">
                  <p className="font-heading text-navy text-2xl">{money(r.amount_pence)}</p>
                  <p className="font-mono text-sm text-secondary-text">{r.description}</p>
                  <p className="font-mono text-xs text-secondary-text flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Supplier pricing and invoices stay private to your trade.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => decide(r.id, "approve")} disabled={busy}>Approve</Button>
                    <Button variant="outline" onClick={() => decide(r.id, "decline")} disabled={busy}>Decline</Button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        <InspectionPanel
          jobId={wallet.job_id}
          role={role}
          stages={stages.map((s) => ({ id: s.id, stage_name: s.stage_name }))}
          reports={reports}
          frozen={wallet.frozen}
          onChanged={load}
        />

        {/* Audit trail */}
        <section className="space-y-3">
          <h2 className="font-heading text-navy text-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal" /> Audit trail
          </h2>
          <p className="font-mono text-xs text-secondary-text">
            Permanent record, visible to both parties, never editable.
          </p>
          <div className="rounded-2xl border border-navy/10 bg-card divide-y divide-navy/5">
            {audit.length === 0 && <p className="p-4 font-mono text-sm text-secondary-text">No activity yet.</p>}
            {audit.map((e) => {
              const d = (e.detail ?? {}) as Record<string, any>;
              return (
                <div key={e.id} className="p-4">
                  <p className="font-mono text-sm text-navy">
                    {e.event_type.replace(/_/g, " ")}
                    {e.actor_role && <span className="text-secondary-text"> · {e.actor_role}</span>}
                  </p>
                  <p className="font-mono text-xs text-secondary-text">
                    {new Date(e.created_at).toLocaleString("en-GB")}
                    {typeof d.amount_pence === "number" && ` · ${money(d.amount_pence)}`}
                    {d.stripe_transfer_id && ` · transfer ${d.stripe_transfer_id}`}
                    {role === "trade" && d.proforma_filename && ` · ${d.proforma_filename}`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProjectWallet;
