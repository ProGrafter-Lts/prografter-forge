import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, FileText, Package, ShieldCheck, PoundSterling, Clock, CheckCircle2,
  XCircle, MapPin, Calendar, Eye, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GenerateQuotePdfButton from "@/components/trade/GenerateQuotePdfButton";
import { isFeatureEnabled } from "@/lib/featureFlags";

const CERT_LABELS: Record<string, string> = {
  building_control: "Building Control involved",
  electrical_cert: "Electrical certificate",
  gas_safe: "Gas Safe certificate",
  fensa: "FENSA / CERTASS certificate",
  mcs: "MCS certificate",
  waste: "Waste transfer note",
  warranty: "Warranty",
  ibg: "Insurance-backed guarantee",
  product_guarantees: "Product guarantees",
  handover_pack: "Completion / handover pack",
};

const TERM_LABELS: Record<string, string> = {
  working_hours: "Working hours",
  variation_process: "Variation process",
  homeowner_responsibilities: "Homeowner responsibilities",
  cancellation_terms: "Cancellation terms",
};

type StatusKey = "submitted" | "accepted" | "declined" | "withdrawn";

const normaliseStatus = (raw: string | null): StatusKey => {
  const s = (raw || "").toLowerCase();
  if (["accepted", "won", "awarded"].includes(s)) return "accepted";
  if (["declined", "rejected", "lost", "not_selected"].includes(s)) return "declined";
  if (["withdrawn", "cancelled", "expired"].includes(s)) return "withdrawn";
  return "submitted";
};

const statusMeta: Record<StatusKey, { label: string; cls: string; icon: typeof Clock }> = {
  submitted: { label: "Awaiting homeowner decision", cls: "bg-amber-100 text-amber-800", icon: Clock },
  accepted: { label: "Accepted", cls: "bg-secondary/15 text-secondary", icon: CheckCircle2 },
  declined: { label: "Not selected", cls: "bg-red-100 text-red-700", icon: XCircle },
  withdrawn: { label: "Withdrawn / expired", cls: "bg-muted text-muted-foreground", icon: XCircle },
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const money = (n: any) => `£${Number(n || 0).toLocaleString()}`;

const Section = ({
  title, icon: Icon, step, children,
}: { title: string; icon: typeof FileText; step?: string; children: React.ReactNode }) => (
  <section className="bg-card rounded-2xl border border-primary/10 p-5 md:p-6">
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-primary" />
      <h2 className="font-heading text-primary text-xl">{title}</h2>
      {step && <span className="font-mono text-[10px] text-muted-foreground ml-auto">{step}</span>}
    </div>
    {children}
  </section>
);

const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="py-2.5 border-b border-primary/5 last:border-0">
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <div className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">
      {value === null || value === undefined || value === "" ? <span className="text-muted-foreground">Not provided</span> : value}
    </div>
  </div>
);

const QuoteDetail = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!quoteId) return;
      const [qRes, mRes] = await Promise.all([
        supabase
          .from("quotes")
          .select("*, jobs(id, title, job_type, postcode, stage)")
          .eq("id", quoteId)
          .maybeSingle(),
        supabase.from("quote_materials").select("*").eq("quote_id", quoteId).order("created_at"),
      ]);
      if (qRes.error || !qRes.data) { setNotFound(true); setLoading(false); return; }
      setQuote(qRes.data);
      setMaterials(mRes.data || []);
      setLoading(false);
    };
    load();
  }, [quoteId]);

  const status: StatusKey = normaliseStatus(quote?.status ?? null);
  const meta = statusMeta[status];

  const materialsTotal = useMemo(
    () => materials.reduce((s, m) => s + (Number(m.quantity) || 0) * (Number(m.unit_price_ex_vat) || 0), 0),
    [materials],
  );

  const schedule: any[] = Array.isArray(quote?.payment_schedule) ? quote.payment_schedule : [];
  const certs: Record<string, string> = quote?.certifications && typeof quote.certifications === "object" ? quote.certifications : {};
  const terms: Record<string, any> = quote?.terms && typeof quote.terms === "object" ? quote.terms : {};

  const expired = quote?.valid_until ? new Date(quote.valid_until) < new Date() : false;

  const timeline = useMemo(() => {
    if (!quote) return [];
    const items = [
      { label: "Quote submitted", at: quote.created_at, done: true },
      { label: "PDF generated", at: quote.pdf_generated_at, done: !!quote.pdf_generated_at },
      { label: quote.view_count ? `Viewed by homeowner (${quote.view_count}×)` : "Viewed by homeowner", at: quote.last_viewed_at, done: !!quote.last_viewed_at },
    ];
    if (status === "accepted") items.push({ label: "Accepted", at: quote.agreed_at || quote.updated_at, done: true });
    if (status === "declined") items.push({ label: "Not selected", at: quote.updated_at, done: true });
    if (status === "submitted") items.push({ label: `Decision due by ${fmtDate(quote.valid_until)}`, at: null, done: false });
    return items;
  }, [quote, status]);

  const nextActions = useMemo(() => {
    if (!quote) return [];
    const list: { text: string; action?: () => void; cta?: string }[] = [];
    if (status === "submitted") {
      if (!quote.pdf_generated_at) list.push({ text: "Generate the PDF so the homeowner has a formal document." });
      if (!quote.last_viewed_at) list.push({ text: "Not opened yet — a short follow-up call or message usually helps." });
      if (expired) list.push({ text: "This quote has passed its valid-until date. Re-issue with updated pricing." });
      if (!schedule.length) list.push({ text: "No stage payments recorded — agree a payment schedule before starting." });
      if (quote.jobs?.id) list.push({ text: "Need to revise the figures?", cta: "Open quote builder", action: () => navigate(`/jobs/${quote.jobs.id}/quote`) });
    }
    if (status === "accepted") list.push({ text: "Accepted — move the job into your pipeline and confirm the start date.", cta: "Open pipeline", action: () => navigate("/dashboard/trade?view=pipeline") });
    if (status === "declined") list.push({ text: "Not selected. Review pricing and scope detail against your won quotes.", cta: "Find more work", action: () => navigate("/dashboard/trade?view=jobs") });
    if (!list.length) list.push({ text: "Nothing outstanding on this quote." });
    return list;
  }, [quote, status, expired, schedule.length, navigate]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center font-mono text-sm text-muted-foreground">Loading quote…</div>;
  }
  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <p className="font-heading text-primary text-2xl">Quote not found</p>
          <button onClick={() => navigate("/dashboard/trade?view=quotes")} className="mt-4 font-mono text-sm text-primary underline">
            Back to Quotes
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = meta.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-5">
        <button
          onClick={() => navigate("/dashboard/trade?view=quotes")}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="w-3 h-3" /> Back to Quotes
        </button>

        {/* Header */}
        <div className="bg-card rounded-2xl border border-primary/10 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-primary text-3xl leading-tight">
                {quote.jobs?.title || quote.jobs?.job_type || "Quote"}
              </h1>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                {quote.reference || quote.id.slice(0, 8)} · submitted {fmtDateTime(quote.created_at)}
              </p>
            </div>
            <span className={`${meta.cls} font-mono text-[11px] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5`}>
              <StatusIcon className="w-3.5 h-3.5" /> {meta.label}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Total</p><p className="font-heading text-primary text-2xl">{money(quote.amount)}</p></div>
            <div><p className="font-mono text-[10px] uppercase text-muted-foreground">VAT</p><p className="font-heading text-primary text-2xl">{quote.vat_status || "—"}</p></div>
            <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Valid until</p><p className={`font-heading text-2xl ${expired ? "text-red-600" : "text-primary"}`}>{fmtDate(quote.valid_until)}</p></div>
            <div><p className="font-mono text-[10px] uppercase text-muted-foreground">Views</p><p className="font-heading text-primary text-2xl">{quote.view_count ?? 0}</p></div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {quote.jobs?.postcode && (
              <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                <MapPin className="w-3 h-3" />{quote.jobs.postcode}
              </span>
            )}
            {quote.jobs?.stage && (
              <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                Job stage: {String(quote.jobs.stage).replace(/_/g, " ")}
              </span>
            )}
            {quote.is_offline_agreement && (
              <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground font-mono text-[11px] px-2.5 py-1.5 rounded-full">
                Offline agreement
              </span>
            )}
            {isFeatureEnabled("quotePdf") && <GenerateQuotePdfButton quoteId={quote.id} />}
          </div>
        </div>

        {/* Timeline + next actions */}
        <div className="grid md:grid-cols-2 gap-5">
          <Section title="Status timeline" icon={Clock}>
            <ol className="space-y-3">
              {timeline.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${t.done ? "bg-secondary" : "bg-primary/20"}`} />
                  <div>
                    <p className={`text-sm ${t.done ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</p>
                    {t.at && <p className="font-mono text-[10px] text-muted-foreground">{fmtDateTime(t.at)}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Next actions" icon={AlertTriangle}>
            <ul className="space-y-3">
              {nextActions.map((a, i) => (
                <li key={i} className="text-sm text-foreground">
                  {a.text}
                  {a.action && (
                    <button onClick={a.action} className="ml-2 font-mono text-[11px] text-primary underline">
                      {a.cta}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Stage 1 */}
        <Section title="Summary & Scope" icon={FileText} step="Wizard stage 1">
          <Field label="Scope of works / message" value={quote.scope_of_works || quote.message} />
          <Field label="Estimated start" value={fmtDate(quote.estimated_start_date)} />
          <Field label="Duration" value={quote.estimated_duration_text} />
          <Field label="VAT amount" value={quote.vat_amount ? money(quote.vat_amount) : null} />
        </Section>

        {/* Stage 2 */}
        <Section title="Materials & Pricing" icon={Package} step="Wizard stage 2">
          {quote.tier_enabled ? (
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {[
                { label: "Budget", price: quote.budget_price, desc: quote.budget_description },
                { label: "Standard", price: quote.standard_price, desc: quote.standard_description },
                { label: "Premium", price: quote.premium_price, desc: quote.premium_description },
              ].map((t) => (
                <div key={t.label} className={`rounded-xl border p-4 ${quote.selected_tier === t.label.toLowerCase() ? "border-secondary" : "border-primary/10"}`}>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">{t.label}</p>
                  <p className="font-heading text-primary text-xl">{money(t.price)}</p>
                  {t.desc && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{t.desc}</p>}
                </div>
              ))}
            </div>
          ) : null}

          {materials.length === 0 ? (
            <p className="font-mono text-sm text-muted-foreground">No itemised materials on this quote.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-mono text-[10px] uppercase text-muted-foreground border-b border-primary/10">
                    <th className="py-2 pr-3">Item</th>
                    <th className="py-2 pr-3">Qty</th>
                    <th className="py-2 pr-3">Unit price</th>
                    <th className="py-2 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b border-primary/5 last:border-0">
                      <td className="py-2 pr-3">
                        {m.description}
                        {(m.brand || m.model_or_spec) && (
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            {[m.brand, m.model_or_spec].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{Number(m.quantity)} {m.unit}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{money(m.unit_price_ex_vat)}</td>
                      <td className="py-2 text-right font-mono text-xs">
                        {money(m.line_total_ex_vat ?? (Number(m.quantity) || 0) * (Number(m.unit_price_ex_vat) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-2 font-mono text-[11px] text-muted-foreground">Materials total (ex VAT)</td>
                    <td className="py-2 text-right font-heading text-primary">{money(materialsTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          <Field label="Shared with homeowner" value={quote.share_materials_with_homeowner ? "Yes" : "No"} />
          <Field label="Provisional sums" value={quote.provisional_sums} />
        </Section>

        {/* Stage 3 */}
        <Section title="Certifications & Terms" icon={ShieldCheck} step="Wizard stage 3">
          <div className="grid sm:grid-cols-2 gap-x-6">
            {Object.keys(CERT_LABELS).map((k) => (
              <Field key={k} label={CERT_LABELS[k]} value={certs[k]} />
            ))}
          </div>
          <div className="mt-4">
            <Field label="Exclusions" value={quote.exclusions} />
            <Field label="Assumptions" value={quote.assumptions} />
            {Object.keys(TERM_LABELS).map((k) => (
              <Field key={k} label={TERM_LABELS[k]} value={terms[k]} />
            ))}
          </div>
        </Section>

        {/* Stage 4 */}
        <Section title="Payment & Review" icon={PoundSterling} step="Wizard stage 4">
          <Field label="Deposit" value={quote.deposit_required ? money(quote.deposit_amount) : "No deposit required"} />
          {schedule.length === 0 ? (
            <p className="font-mono text-sm text-muted-foreground mt-3">No stage payment schedule recorded.</p>
          ) : (
            <ol className="mt-3 space-y-2">
              {schedule.map((s, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-xl border border-primary/10 p-3">
                  <div>
                    <p className="text-sm text-foreground">{s.order ?? i + 1}. {s.name || "Stage"}</p>
                    {s.trigger && <p className="font-mono text-[10px] text-muted-foreground">Trigger: {s.trigger}</p>}
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-heading text-primary">{money(s.amount)}</p>
                    {s.percentage != null && <p className="font-mono text-[10px] text-muted-foreground">{s.percentage}%</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 grid sm:grid-cols-2 gap-x-6">
            <Field label="Last viewed" value={quote.last_viewed_at ? <span className="inline-flex items-center gap-1.5"><Eye className="w-3 h-3" />{fmtDateTime(quote.last_viewed_at)}</span> : null} />
            <Field label="PDF generated" value={quote.pdf_generated_at ? <span className="inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />{fmtDateTime(quote.pdf_generated_at)}</span> : null} />
          </div>
        </Section>
      </div>
    </div>
  );
};

export default QuoteDetail;
