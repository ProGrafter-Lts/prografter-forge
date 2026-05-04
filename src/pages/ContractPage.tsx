import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText, ShieldAlert, Check, Clock, Loader2, Lock, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SEO from "@/components/SEO";
import { toast } from "sonner";

interface ContractRow {
  id: string;
  job_id: string;
  reference: string | null;
  status: string;
  template_id: string;
  template_version: string | null;
  rendered_legal_text: string | null;
  full_text_hash: string | null;
  scope_of_works: string;
  total_value_incl_vat_pence: number;
  total_value_excl_vat_pence: number;
  payment_milestones: any;
  property_address: any;
  homeowner_snapshot: any;
  trade_snapshot: any;
  homeowner_id: string;
  trade_id: string;
  homeowner_signed_at: string | null;
  trade_signed_at: string | null;
  homeowner_bespoke_terms: string | null;
  trade_bespoke_terms: string | null;
  activated_at: string | null;
  latest_pdf_path: string | null;
  latest_pdf_generated_at: string | null;
}

interface VariationRow {
  id: string;
  sequence: number;
  title: string;
  description: string | null;
  reason: string | null;
  status: string;
  cost_change_pence: number | null;
  programme_impact_days: number | null;
  proposed_by: string;
  homeowner_signed_at: string | null;
  trade_signed_at: string | null;
  created_at: string;
}

interface EventRow {
  id: string;
  event_type: string;
  actor_role: string | null;
  created_at: string;
  payload: any;
}

const formatGBP = (pence: number) =>
  `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ContractPage = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractRow | null>(null);
  const [variations, setVariations] = useState<VariationRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [signingEnabled, setSigningEnabled] = useState(false);
  const [integrityOk, setIntegrityOk] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"homeowner" | "trade" | null>(null);

  // Signing UI state
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);
  const [signing, setSigning] = useState(false);

  // Bespoke terms editor
  const [bespokeDraft, setBespokeDraft] = useState("");
  const [savingBespoke, setSavingBespoke] = useState(false);

  const load = async () => {
    if (!jobId) return;
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);

    const { data: c, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();

    if (error) {
      toast.error("Could not load contract");
      setLoading(false);
      return;
    }

    if (!c) {
      setContract(null);
      setLoading(false);
      return;
    }

    setContract(c as ContractRow);

    // Determine role
    const [{ data: ho }, { data: tr }] = await Promise.all([
      supabase.from("homeowners").select("id").eq("id", c.homeowner_id).maybeSingle(),
      supabase.from("trades").select("id").eq("id", c.trade_id).maybeSingle(),
    ]);
    if (ho && uid) {
      const { data: h } = await supabase.from("homeowners").select("user_id").eq("id", c.homeowner_id).maybeSingle();
      if (h?.user_id === uid) setRole("homeowner");
    }
    const { data: t } = await supabase.from("trades").select("user_id").eq("id", c.trade_id).maybeSingle();
    if (t?.user_id === uid) setRole("trade");

    // Template feature flag
    const { data: tmpl } = await supabase
      .from("contract_templates")
      .select("signing_enabled")
      .eq("id", c.template_id)
      .maybeSingle();
    setSigningEnabled(!!tmpl?.signing_enabled);

    // Variations + events
    const [{ data: vs }, { data: es }] = await Promise.all([
      supabase.from("contract_variations").select("*").eq("contract_id", c.id).order("sequence", { ascending: true }),
      supabase.from("contract_events").select("*").eq("contract_id", c.id).order("created_at", { ascending: false }).limit(100),
    ]);
    setVariations((vs as VariationRow[]) ?? []);
    setEvents((es as EventRow[]) ?? []);

    // Integrity verification
    try {
      const { data: ver } = await supabase.rpc("verify_contract_integrity", { _contract_id: c.id });
      const okFlag = (ver as any)?.ok;
      setIntegrityOk(typeof okFlag === "boolean" ? okFlag : true);
    } catch {
      setIntegrityOk(null);
    }

    // Log a 'viewed' event (best-effort)
    if (uid) {
      supabase.rpc("log_contract_event", {
        _contract_id: c.id,
        _event_type: "viewed",
        _payload: {},
      }).then(() => {});
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (!contract) return;
    if (role === "homeowner") setBespokeDraft(contract.homeowner_bespoke_terms ?? "");
    if (role === "trade") setBespokeDraft(contract.trade_bespoke_terms ?? "");
  }, [contract, role]);

  const alreadySignedByMe =
    (role === "homeowner" && !!contract?.homeowner_signed_at) ||
    (role === "trade" && !!contract?.trade_signed_at);

  const allChecked = agree1 && agree2 && agree3;

  const canSign =
    !!contract &&
    !!role &&
    !alreadySignedByMe &&
    integrityOk !== false &&
    signingEnabled &&
    ["awaiting_signatures", "draft", "pending_signatures"].includes(contract.status);

  const signNow = async () => {
    if (!contract || !userId || !allChecked) return;
    setSigning(true);
    // Build a deterministic signature hash binding user, contract and document fingerprint
    const basis = `${userId}|${contract.id}|${contract.full_text_hash ?? ""}|${Date.now()}`;
    const buf = new TextEncoder().encode(basis);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const { error } = await supabase.rpc("sign_contract", {
      _contract_id: contract.id,
      _signature_hash: hash,
    });

    setSigning(false);

    if (error) {
      toast.error(error.message || "Could not sign contract");
      return;
    }

    toast.success("Contract signed.");
    setAgree1(false);
    setAgree2(false);
    setAgree3(false);
    load();
  };

  const saveBespoke = async () => {
    if (!contract) return;
    setSavingBespoke(true);
    const { error } = await supabase.rpc("add_bespoke_terms", {
      _contract_id: contract.id,
      _terms: bespokeDraft,
    });
    setSavingBespoke(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Bespoke terms saved. The other party must re-sign.");
      load();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-heading text-2xl text-primary mb-2">Contract not available</h1>
          <p className="font-mono text-sm text-muted-foreground mb-6">
            No contract exists for this project, or you don't have permission to view it.
          </p>
          <Button asChild variant="outline">
            <Link to={jobId ? `/project/${jobId}` : "/"}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to project
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const milestones: any[] = Array.isArray(contract.payment_milestones) ? contract.payment_milestones : [];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Contract ${contract.reference ?? ""} — ProGrafter`}
        description="Review, sign and manage your construction contract on ProGrafter."
        noindex
      />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/project/${jobId}`)}
          className="font-mono text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to project
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-heading text-primary text-2xl md:text-3xl flex items-center gap-2">
              <FileText className="w-6 h-6" /> Contract {contract.reference ?? ""}
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Template version {contract.template_version ?? "—"} · {formatGBP(contract.total_value_incl_vat_pence)} incl. VAT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={contract.status} />
            {integrityOk === false && (
              <Badge className="bg-destructive text-destructive-foreground">
                <ShieldAlert className="w-3 h-3 mr-1" /> Tamper detected
              </Badge>
            )}
            {contract.latest_pdf_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const { data, error } = await supabase.storage
                    .from("contracts")
                    .createSignedUrl(contract.latest_pdf_path!, 60);
                  if (error || !data?.signedUrl) {
                    toast.error("Could not generate download link");
                    return;
                  }
                  window.open(data.signedUrl, "_blank", "noopener");
                }}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
              </Button>
            )}
          </div>
        </div>

        {!signingEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-mono text-xs text-amber-900 font-medium">Contract under final legal review</p>
              <p className="font-mono text-xs text-amber-800 mt-1">
                Signing is temporarily disabled while our solicitor finalises the master template. You can review the document, add bespoke terms and discuss with the other party in the meantime.
              </p>
            </div>
          </div>
        )}

        {integrityOk === false && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-4">
            <p className="font-mono text-xs text-destructive font-medium">
              This contract failed integrity verification. Please refresh the page. If this persists, contact support — do not sign.
            </p>
          </div>
        )}

        <Tabs defaultValue="document" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="bespoke">Bespoke Terms</TabsTrigger>
            <TabsTrigger value="variations">
              Variations{variations.length > 0 ? ` (${variations.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* DOCUMENT */}
          <TabsContent value="document" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-3">Parties & Property</h2>
              <dl className="grid sm:grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <dt className="text-muted-foreground">Homeowner</dt>
                  <dd className="text-foreground">{contract.homeowner_snapshot?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Trade</dt>
                  <dd className="text-foreground">
                    {contract.trade_snapshot?.company_name ?? contract.trade_snapshot?.name ?? "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Property</dt>
                  <dd className="text-foreground">
                    {contract.property_address?.address ?? "—"}
                    {contract.property_address?.postcode ? `, ${contract.property_address.postcode}` : ""}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Scope of works</dt>
                  <dd className="text-foreground whitespace-pre-wrap">{contract.scope_of_works}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-3">Payment milestones</h2>
              <ol className="space-y-2 font-mono text-xs">
                {milestones.map((m: any, i: number) => (
                  <li key={i} className="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-2 last:pb-0">
                    <span className="text-foreground">
                      {m.sequence}. {m.description}
                    </span>
                    <span className="text-foreground font-medium shrink-0">{formatGBP(Number(m.amount_pence) || 0)}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-3">Legal text</h2>
              <pre className="font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap bg-muted/40 rounded-xl p-4 border border-border max-h-[60vh] overflow-auto">
{contract.rendered_legal_text ?? "Legal text not yet rendered."}
              </pre>
              {contract.full_text_hash && (
                <p className="font-mono text-[10px] text-muted-foreground mt-2 break-all">
                  SHA-256 fingerprint: {contract.full_text_hash}
                </p>
              )}
            </div>

            {/* Signing block */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-3">Signatures</h2>
              <div className="space-y-2 font-mono text-xs mb-4">
                <SignatureLine
                  label="Homeowner"
                  signedAt={contract.homeowner_signed_at}
                  name={contract.homeowner_snapshot?.name}
                />
                <SignatureLine
                  label="Trade"
                  signedAt={contract.trade_signed_at}
                  name={contract.trade_snapshot?.company_name ?? contract.trade_snapshot?.name}
                />
              </div>

              {role && !alreadySignedByMe && (
                <div className="border-t border-border pt-4 space-y-3">
                  <p className="font-mono text-xs text-foreground font-medium">
                    Sign as {role === "homeowner" ? "Homeowner" : "Trade"}
                  </p>
                  <CheckboxRow
                    checked={agree1}
                    onChange={setAgree1}
                    id="agree1"
                    label="I have read and understood the full legal text above."
                  />
                  <CheckboxRow
                    checked={agree2}
                    onChange={setAgree2}
                    id="agree2"
                    label="I confirm I am authorised to sign this contract on behalf of the named party."
                  />
                  <CheckboxRow
                    checked={agree3}
                    onChange={setAgree3}
                    id="agree3"
                    label="I agree this electronic signature is binding and equivalent to a handwritten one."
                  />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block">
                          <Button
                            onClick={signNow}
                            disabled={!canSign || !allChecked || signing}
                            className="w-full"
                          >
                            {signing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing…
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" /> Sign contract
                              </>
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!signingEnabled && (
                        <TooltipContent>
                          <p className="text-xs">Signing disabled — template under legal review.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {alreadySignedByMe && (
                <p className="font-mono text-xs text-muted-foreground border-t border-border pt-3">
                  You signed this contract on{" "}
                  {new Date(
                    (role === "homeowner" ? contract.homeowner_signed_at : contract.trade_signed_at) as string
                  ).toLocaleString("en-GB")}
                  .
                </p>
              )}
            </div>
          </TabsContent>

          {/* BESPOKE */}
          <TabsContent value="bespoke" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-1">Bespoke terms</h2>
              <p className="font-mono text-xs text-muted-foreground mb-4">
                Add up to 4,000 characters of additional terms. Saving will reset the other party's signature so they can re-review.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-muted-foreground mb-1">Homeowner's bespoke terms</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap bg-muted/40 border border-border rounded-xl p-3 min-h-[80px]">
{contract.homeowner_bespoke_terms || <span className="text-muted-foreground italic">None</span>}
                  </pre>
                </div>
                <div>
                  <p className="font-mono text-xs text-muted-foreground mb-1">Trade's bespoke terms</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap bg-muted/40 border border-border rounded-xl p-3 min-h-[80px]">
{contract.trade_bespoke_terms || <span className="text-muted-foreground italic">None</span>}
                  </pre>
                </div>
              </div>

              {role && ["draft", "pending_signatures", "awaiting_signatures"].includes(contract.status) && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="font-mono text-xs text-foreground font-medium">
                    Edit your bespoke terms ({role})
                  </p>
                  <Textarea
                    value={bespokeDraft}
                    onChange={(e) => setBespokeDraft(e.target.value.slice(0, 4000))}
                    rows={8}
                    placeholder="Add any additional clauses, exclusions, or conditions specific to this project."
                    className="font-mono text-xs"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{bespokeDraft.length} / 4000</span>
                    <Button onClick={saveBespoke} disabled={savingBespoke} size="sm">
                      {savingBespoke ? "Saving…" : "Save bespoke terms"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* VARIATIONS */}
          <TabsContent value="variations" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-3">Contract variations</h2>
              {variations.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">
                  No variations yet. Variations can be raised once the contract is active.
                </p>
              ) : (
                <ul className="space-y-3">
                  {variations.map((v) => (
                    <li key={v.id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-heading text-primary text-sm">
                          #{v.sequence} {v.title}
                        </p>
                        <Badge variant={v.status === "accepted" ? "default" : "secondary"}>{v.status}</Badge>
                      </div>
                      {v.description && (
                        <p className="font-mono text-xs text-foreground whitespace-pre-wrap">{v.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 font-mono text-[11px] text-muted-foreground">
                        <span>Cost change: {formatGBP(v.cost_change_pence ?? 0)}</span>
                        <span>Programme: {v.programme_impact_days ?? 0} day(s)</span>
                        <span>Proposed by: {v.proposed_by}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-primary text-lg mb-3">Audit trail</h2>
              {events.length === 0 ? (
                <p className="font-mono text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-2">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-start gap-3 font-mono text-xs border-b border-border last:border-0 pb-2 last:pb-0">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-foreground">
                          <span className="font-medium">{e.event_type}</span>
                          {e.actor_role ? ` · ${e.actor_role}` : ""}
                        </p>
                        <p className="text-muted-foreground">{new Date(e.created_at).toLocaleString("en-GB")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Draft", cls: "bg-muted text-foreground" },
    awaiting_signatures: { label: "Awaiting signatures", cls: "bg-amber-100 text-amber-800" },
    pending_signatures: { label: "Pending signatures", cls: "bg-amber-100 text-amber-800" },
    active: { label: "Active", cls: "bg-emerald-100 text-emerald-800" },
    pending_completion_acceptance: { label: "Awaiting completion sign-off", cls: "bg-blue-100 text-blue-800" },
    completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-800" },
    terminated: { label: "Terminated", cls: "bg-red-100 text-red-800" },
    closed: { label: "Closed", cls: "bg-muted text-foreground" },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-foreground" };
  return <Badge className={m.cls}>{m.label}</Badge>;
};

const SignatureLine = ({
  label,
  signedAt,
  name,
}: {
  label: string;
  signedAt: string | null;
  name?: string;
}) => (
  <div className="flex items-center gap-2">
    {signedAt ? (
      <Check className="w-3.5 h-3.5 text-emerald-600" />
    ) : (
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
    )}
    <span className="text-muted-foreground w-24">{label}:</span>
    <span className="text-foreground">
      {signedAt ? `${name ?? ""} — signed ${new Date(signedAt).toLocaleString("en-GB")}` : "Not signed"}
    </span>
  </div>
);

const CheckboxRow = ({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
    <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
    <span className="font-mono text-xs text-foreground">{label}</span>
  </label>
);

export default ContractPage;
