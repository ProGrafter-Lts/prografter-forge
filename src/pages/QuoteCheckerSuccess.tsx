import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { MODULE_REPORT_PATH, type ModuleId } from "@/lib/quoteCheckerPayment";
import { Button } from "@/components/ui/button";

const QuoteCheckerSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"working" | "error" | "waiting">("working");
  const [message, setMessage] = useState("Payment received — preparing your report…");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing payment reference.");
      return;
    }
    let cancelled = false;

    const tick = async () => {
      attemptsRef.current += 1;
      try {
        const { data, error } = await supabase.functions.invoke("run-paid-module-check", {
          body: { sessionId },
        });
        if (cancelled) return;
        if (error) throw error;

        if (data?.paid === false) {
          setStatus("waiting");
          setMessage("Payment still processing — this usually takes a few seconds.");
          if (attemptsRef.current < 20) setTimeout(tick, 2500);
          return;
        }

        if (data?.paid && data?.id && data?.module_id) {
          const reportBase = MODULE_REPORT_PATH[data.module_id as ModuleId];
          if (!reportBase) throw new Error("Unknown module in response");
          const tokenParam = data.lookupToken ? `?t=${encodeURIComponent(data.lookupToken)}` : "";
          navigate(`${reportBase}/${data.id}${tokenParam}`, { replace: true });
          return;
        }

        throw new Error("Unexpected response");
      } catch (err) {
        console.error(err);
        if (attemptsRef.current < 6) {
          setTimeout(tick, 3000);
        } else {
          setStatus("error");
          setMessage("We couldn't finalise your report automatically. Please contact support with your payment reference.");
        }
      }
    };

    tick();
    return () => { cancelled = true; };
  }, [sessionId, navigate]);

  return (
    <AppShell>
      <SEO title="Preparing your Quote Report | ProGrafter" description="Payment confirmed — ProGrafter is preparing your Quote Checker report." path="/quote-checker/success" />
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 mx-auto">
          <ShieldCheck className="h-4 w-4 text-teal" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-teal">Quote Checker</span>
        </div>
        {status !== "error" ? (
          <>
            <Loader2 className="h-10 w-10 text-teal animate-spin mx-auto" />
            <h1 className="font-heading text-2xl text-navy">Preparing your report…</h1>
            <p className="font-mono text-sm text-muted-foreground">{message}</p>
            <p className="font-mono text-[11px] text-muted-foreground">Please don't close this page — your report opens automatically.</p>
          </>
        ) : (
          <>
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h1 className="font-heading text-2xl text-navy">Something went wrong</h1>
            <p className="font-mono text-sm text-muted-foreground">{message}</p>
            <Button onClick={() => navigate("/quote-checker")} className="bg-teal text-white hover:bg-teal-hover font-mono text-sm">
              Back to Quote Checker
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default QuoteCheckerSuccess;
