import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { ShieldCheck, BadgeCheck, FileText, Send, Upload, RefreshCw, Loader2 } from "lucide-react";

interface InviteData {
  trade_name: string;
  company_name: string;
  trade_type: string;
  verified: boolean;
  verification_status: string | null;
  project_type: string | null;
  planning_application_id: string;
}

export default function PlanningInvite() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) return;
      const { data: link, error: linkErr } = await supabase
        .from("planning_invite_links")
        .select("trade_id, planning_application_id, project_type, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (cancelled) return;
      if (linkErr || !link) {
        setError("This invite link is not valid or has expired.");
        setLoading(false);
        return;
      }

      // best-effort: mark clicked
      void supabase
        .from("planning_invite_links")
        .update({ clicked_at: new Date().toISOString() })
        .eq("token", token);

      const { data: trade } = await supabase
        .from("trades")
        .select("name, company_name, trade_type, verified, verification_status")
        .eq("id", link.trade_id)
        .maybeSingle();

      if (cancelled) return;
      setInvite({
        trade_name: trade?.name ?? "A ProGrafter-verified trade",
        company_name: trade?.company_name ?? "",
        trade_type: trade?.trade_type ?? "",
        verified: trade?.verified ?? false,
        verification_status: trade?.verification_status ?? null,
        project_type: link.project_type,
        planning_application_id: link.planning_application_id,
      });
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      <SEO
        title="You've been invited to ProGrafter"
        description="View a verified ProGrafter trade profile and submit your project details securely."
        path={`/planning-invite/${token}`}
      />
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-xl">
          <Link to="/" className="block text-center mb-8 font-heading text-primary text-2xl">
            ProGrafter
          </Link>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading invite…
            </div>
          ) : error ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="font-sans text-sm text-muted-foreground">{error}</p>
              <Link to="/" className="inline-block mt-4 font-mono text-xs text-secondary uppercase tracking-wider hover:underline">
                Go to ProGrafter →
              </Link>
            </div>
          ) : invite ? (
            <div className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6">
                <p className="font-sans text-sm text-foreground leading-relaxed">
                  <span className="font-semibold text-primary">
                    {invite.company_name || invite.trade_name}
                  </span>{" "}
                  has invited you to view their verified ProGrafter profile and submit
                  your project details through ProGrafter.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Trade business
                  </p>
                  <p className="font-heading text-primary text-lg">
                    {invite.company_name || invite.trade_name}
                  </p>
                  {invite.trade_type && (
                    <p className="font-mono text-xs text-secondary mt-0.5 uppercase tracking-wider">
                      {invite.trade_type}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(invite.verified || invite.verification_status === "approved") && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 font-mono text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified trade
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-secondary/10 text-secondary border border-secondary/30 font-mono text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Insurance &amp; qualifications checked
                  </span>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Project reference
                  </p>
                  <p className="font-mono text-sm text-primary">
                    {invite.project_type || "Home project"} · {invite.planning_application_id}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <Link
                  to="/post-job-brief"
                  className="w-full flex items-center justify-center gap-2 bg-secondary text-primary-foreground font-mono text-xs px-4 py-3 rounded-xl hover:bg-secondary/90 transition-colors uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" /> Submit project details
                </Link>
                <Link
                  to="/quote-checker"
                  className="w-full flex items-center justify-center gap-2 bg-card border-2 border-primary text-primary font-mono text-xs px-4 py-3 rounded-xl hover:bg-primary/5 transition-colors uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" /> Upload quote for Quote Health Check
                </Link>
                <Link
                  to="/post-job-brief"
                  className="w-full flex items-center justify-center gap-2 bg-transparent border border-border text-muted-foreground font-mono text-xs px-4 py-3 rounded-xl hover:bg-muted transition-colors uppercase tracking-wider"
                >
                  <RefreshCw className="w-4 h-4" /> Request another matched quote
                </Link>
              </div>

              <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
                  This trade found your project through public planning information and
                  invited you via ProGrafter. There's no obligation — everything stays
                  secure and in your control through ProGrafter.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
