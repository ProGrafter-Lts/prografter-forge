import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import SEO from "@/components/SEO";
import Logo from "@/components/Logo";

type Status = "pending" | "approved" | "info_requested" | "rejected" | null;

const SignupTradeUnderReview = () => {
  const navigate = useNavigate();
  const { isReady, user } = useAuthReady();
  const [status, setStatus] = useState<Status>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("trades")
        .select("verification_status, verification_notes, rejection_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setStatus(data.verification_status as Status);
        setNotes((data as any).verification_notes ?? null);
        setRejectionReason((data as any).rejection_reason ?? null);
        if (data.verification_status === "approved") {
          setTimeout(() => navigate("/dashboard/trade", { replace: true }), 1500);
        }
      }
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [isReady, user, navigate]);

  const Icon =
    status === "approved" ? CheckCircle2 :
    status === "info_requested" ? AlertCircle :
    status === "rejected" ? XCircle : Clock;

  const tone =
    status === "approved" ? "text-teal" :
    status === "info_requested" ? "text-yellow-400" :
    status === "rejected" ? "text-red-400" : "text-teal";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "hsl(var(--deep))" }}>
      <SEO title="Application under review — ProGrafter" description="Your trade application is being reviewed." path="/signup/trade/under-review" />
      <header className="py-6 px-6">
        <Link to="/" className="font-heading text-2xl tracking-wider">
          <Logo variant="light" className="h-9 w-auto inline-block" />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">
          {loading ? (
            <p className="font-mono text-sm text-cream/60">Loading…</p>
          ) : status === "approved" ? (
            <>
              <Icon className={`${tone} w-16 h-16 mx-auto mb-4`} strokeWidth={1.5} />
              <h1 className="font-heading text-cream text-4xl mb-3">You're <span className="text-teal">approved.</span></h1>
              <p className="font-body text-cream/70 mb-6">Welcome to ProGrafter. Redirecting you to your dashboard…</p>
            </>
          ) : status === "info_requested" ? (
            <>
              <Icon className={`${tone} w-16 h-16 mx-auto mb-4`} strokeWidth={1.5} />
              <h1 className="font-heading text-cream text-4xl mb-3">More info needed.</h1>
              <p className="font-body text-cream/70 mb-4">Our team needs a bit more from you:</p>
              {notes && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 text-sm font-body text-left mb-6">
                  {notes}
                </div>
              )}
              <Link to="/signup/trade" className="inline-block bg-teal text-cream font-mono text-sm py-3 px-8 rounded-xl hover:bg-teal-hover transition-colors">
                Resubmit
              </Link>
            </>
          ) : status === "rejected" ? (
            <>
              <Icon className={`${tone} w-16 h-16 mx-auto mb-4`} strokeWidth={1.5} />
              <h1 className="font-heading text-cream text-4xl mb-3">Application not approved.</h1>
              {rejectionReason && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-100 text-sm font-body text-left mb-6">
                  {rejectionReason}
                </div>
              )}
              <p className="font-body text-cream/60 text-sm">Get in touch if you'd like to discuss: <a className="text-teal underline" href="mailto:hello@prografter.co.uk">hello@prografter.co.uk</a></p>
            </>
          ) : (
            <>
              <a href="/" className="font-heading text-[32px] leading-none tracking-wider inline-block mb-6">
                <Logo variant="light" className="h-9 w-auto inline-block" />
              </a>
              <Icon className={`${tone} w-16 h-16 mx-auto mb-4`} strokeWidth={1.5} />
              <h1 className="font-heading text-cream text-4xl mb-3">Application <span className="text-teal">received.</span></h1>
              <p className="font-body text-cream/80 mb-3">
                We have everything we need — your documents, details and qualifications are all with us.
              </p>
              <p className="font-body text-cream/70 mb-2">
                Our team reviews every application within 1 working day. You'll receive an email the moment you're verified, at which point you can start quoting on jobs straight away.
              </p>
              <p className="font-body text-cream/60 text-sm mb-8">There's nothing else you need to do.</p>
              <div className="flex flex-col gap-3 items-center">
                <Link to="/dashboard/trade" className="inline-block bg-teal text-cream font-mono text-sm py-3 px-8 rounded-xl hover:bg-teal-hover transition-colors">
                  Go to dashboard
                </Link>
                <button onClick={() => window.location.reload()} className="font-mono text-xs text-teal hover:underline">
                  Check status again
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignupTradeUnderReview;
