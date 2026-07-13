import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import BoilerQuoteReport, { type BoilerReportJson } from "@/components/boiler-quote/BoilerQuoteReport";
import { Loader2, AlertTriangle } from "lucide-react";

const BoilerQuoteReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t") || "";

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [report, setReport] = useState<BoilerReportJson | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled || !id || !token) {
        if (!token) { setStatus("error"); setMessage("Missing secure access token."); }
        return;
      }
      attempts += 1;
      try {
        const { data, error } = await supabase.functions.invoke("read-simple-quote-check", {
          body: { checkId: id, lookupToken: token },
        });
        if (error) throw error;
        if (cancelled) return;

        if (data?.status === "complete" && data?.report_json) {
          setReport(data.report_json as BoilerReportJson);
          setStatus("ready");
          return;
        }
        if (data?.status === "error") {
          setStatus("error");
          setMessage(data?.error || "The analysis failed. Please try again.");
          return;
        }
        if (attempts < 40) setTimeout(poll, 3000);
        else { setStatus("error"); setMessage("This is taking longer than expected. Please try again shortly."); }
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setMessage("We couldn't load this report.");
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [id, token]);

  const notBoiler = status === "ready" && report && report.is_boiler_quote === false;

  return (
    <AppShell>
      <SEO
        title="Your Boiler Quote Check Report | ProGrafter"
        description="Your boiler / heating quote check report."
        path="/boiler-quote-report"
        noindex
      />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-10 md:pt-28 md:pb-14">
        {status === "loading" && (
          <div className="text-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-teal animate-spin mx-auto" />
            <p className="font-mono text-sm text-muted-foreground">Checking your quote… this usually takes under a minute.</p>
          </div>
        )}
        {status === "error" && (
          <div className="text-center py-20 space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="font-mono text-sm text-navy">{message}</p>
            <a href="/boiler-quote-checker" className="font-mono text-sm text-teal underline">Start a new check</a>
          </div>
        )}
        {notBoiler && (
          <div className="text-center py-20 space-y-4">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
            <p className="font-mono text-sm text-navy max-w-md mx-auto">
              {report?.not_boiler_note ||
                "This does not appear to be a boiler/heating quote. Please choose a different quote type or request a manual review."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/quote-checker" className="font-mono text-sm text-teal underline">Choose a different quote type</a>
              <a href="/quote-checker" className="font-mono text-sm text-teal underline">Request a manual review</a>
            </div>
          </div>
        )}
        {status === "ready" && report && !notBoiler && (
          <>
            <div className="mb-6">
              <h1 className="font-heading text-2xl md:text-3xl text-navy">Your Boiler Quote Check</h1>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                A simple, quote-focused review of your boiler or heating quote.
              </p>
            </div>
            <BoilerQuoteReport report={report} />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default BoilerQuoteReportPage;
