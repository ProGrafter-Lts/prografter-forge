import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

type QuoteRow = Record<string, any>;

interface Payload {
  quote: QuoteRow;
  job: { id: string; title: string; description: string | null; postcode: string | null; ref: string | null } | null;
  trade: { company_name: string | null; trade_type: string | null } | null;
}

const gbp = (n: number | null | undefined) =>
  typeof n === "number" ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n) : "—";

export default function PublicQuoteView() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Payload | null>(null);
  const [deciding, setDeciding] = useState<null | "accepted" | "declined">(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!quoteId || !token) {
        setLoading(false);
        return;
      }
      const { data: res, error } = await supabase.rpc("get_quote_by_token", {
        _quote_id: quoteId,
        _token: token,
      });
      if (!active) return;
      if (error) console.error(error);
      setData((res as unknown as Payload) ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [quoteId, token]);

  const decide = async (decision: "accepted" | "declined") => {
    if (!quoteId || !token) return;
    setDeciding(decision);
    const { data: res, error } = await supabase.rpc("decide_quote_by_token", {
      _quote_id: quoteId,
      _token: token,
      _decision: decision,
    });
    setDeciding(null);
    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    const out = res as any;
    if (!out?.ok) {
      toast.error(out?.error === "already_decided" ? `This quote is already marked ${out.status}.` : "Link not valid.");
    } else {
      toast.success(decision === "accepted" ? "Quote accepted — the tradesperson has been notified." : "Quote declined.");
    }
    setData((d) => (d ? { ...d, quote: { ...d.quote, status: decision } } : d));
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>This quote link isn’t valid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>The link may have expired, been withdrawn, or copied incorrectly. Please check the email again or contact the tradesperson.</p>
            <Button asChild variant="outline">
              <Link to="/">Back to ProGrafter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const q = data.quote;
  const status = String(q.status || "submitted");
  const decided = ["accepted", "declined", "withdrawn"].includes(status);
  const lineItems: any[] = Array.isArray(q.line_items) ? q.line_items : [];
  const schedule: any[] = Array.isArray(q.payment_schedule) ? q.payment_schedule : [];

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Quote {q.reference || ""}</p>
            <h1 className="text-2xl font-semibold">{data.job?.title || "Your project quote"}</h1>
            <p className="text-sm text-muted-foreground">
              From {data.trade?.company_name || "your tradesperson"}
              {data.job?.postcode ? ` · ${data.job.postcode}` : ""}
            </p>
          </div>
          <Badge variant={status === "accepted" ? "default" : "secondary"} className="capitalize">
            {status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{gbp(Number(q.amount))}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {q.vat_status && <p className="text-muted-foreground">VAT: {q.vat_status}{q.vat_amount ? ` (${gbp(Number(q.vat_amount))})` : ""}</p>}
            {q.estimated_duration_text && <p><span className="font-medium">Duration:</span> {q.estimated_duration_text}</p>}
            {q.estimated_start_date && <p><span className="font-medium">Estimated start:</span> {new Date(q.estimated_start_date).toLocaleDateString("en-GB")}</p>}
            {q.valid_until && <p><span className="font-medium">Valid until:</span> {new Date(q.valid_until).toLocaleDateString("en-GB")}</p>}
          </CardContent>
        </Card>

        {q.scope_of_works && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Scope of works</CardTitle></CardHeader>
            <CardContent className="text-sm whitespace-pre-wrap">{q.scope_of_works}</CardContent>
          </Card>
        )}

        {lineItems.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {lineItems.map((li, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span>{li.description || li.name || `Item ${i + 1}`}</span>
                  <span className="font-medium">{gbp(Number(li.total ?? li.amount ?? li.price))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {schedule.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Payment schedule</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {schedule.map((s, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span>{s.label || s.stage || `Stage ${i + 1}`}</span>
                  <span className="font-medium">{gbp(Number(s.amount))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(q.exclusions || q.assumptions) && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Exclusions & assumptions</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm whitespace-pre-wrap">
              {q.assumptions && <p>{q.assumptions}</p>}
              {q.exclusions && <p>{q.exclusions}</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 space-y-4">
            {decided ? (
              <div className="flex items-center gap-2 text-sm">
                {status === "accepted" ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                <span>You’ve already marked this quote <strong>{status}</strong>.</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Happy with this quote? Accepting lets your tradesperson start scheduling. You can also decline if it isn’t right.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1" disabled={!!deciding} onClick={() => decide("accepted")}>
                    {deciding === "accepted" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Accept quote
                  </Button>
                  <Button variant="outline" className="flex-1" disabled={!!deciding} onClick={() => decide("declined")}>
                    Decline
                  </Button>
                </div>
              </>
            )}
            <Separator />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Sent securely via ProGrafter. <Link to="/trust" className="underline">Trust Centre</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
