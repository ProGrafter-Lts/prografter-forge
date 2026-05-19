import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Copy, Check, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CalendarConnectProps {
  /** "full" → settings page card, "compact" → dashboard widget */
  variant?: "full" | "compact";
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const CalendarConnect = ({ variant = "full" }: CalendarConnectProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("trades")
      .select("calendar_token")
      .eq("user_id", user.id)
      .maybeSingle();
    setToken(data?.calendar_token ?? null);
    setLoading(false);
  };

  const feedUrl = token
    ? `${SUPABASE_URL}/functions/v1/ics-feed?token=${token}`
    : "";

  // Friendly public URL we'd expose via hosting rewrite/custom domain
  const friendlyUrl = token
    ? `https://prografter.co.uk/cal/trade/${token}.ics`
    : "";

  const copyLink = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast({ title: "Calendar link copied", description: "Paste it into your calendar app." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const regenerate = async () => {
    if (!confirm("This will invalidate your existing calendar link. Continue?")) return;
    setRegenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRegenerating(false);
      return;
    }
    // Generate a new uuid client-side via crypto
    const newToken = crypto.randomUUID();
    const { error } = await supabase
      .from("trades")
      .update({ calendar_token: newToken })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Could not regenerate", description: error.message, variant: "destructive" });
    } else {
      setToken(newToken);
      toast({ title: "New calendar link generated", description: "Old link is no longer active." });
    }
    setRegenerating(false);
  };

  if (variant === "compact") {
    return (
      <div className="bg-card border-2 border-foreground rounded p-5 shadow-[4px_4px_0_0_hsl(var(--foreground))]">
        <div className="flex items-start gap-3">
          <div className="bg-secondary/10 border-2 border-secondary rounded p-2">
            <Calendar className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg text-primary tracking-wide">
              Connect Your Calendar
            </h3>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Sync project dates, stages and payment milestones to Google, Apple or Outlook.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={copyLink}
                disabled={!feedUrl || loading}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded font-mono text-xs hover:bg-primary/90 transition disabled:opacity-50"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href="/dashboard/trade/settings"
                className="flex items-center gap-1.5 border-2 border-foreground px-3 py-1.5 rounded font-mono text-xs hover:bg-foreground/5 transition"
              >
                Setup <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-card border-2 border-foreground rounded p-6 md:p-8 shadow-[6px_6px_0_0_hsl(var(--foreground))]">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-secondary/10 border-2 border-secondary rounded p-3">
          <Calendar className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h2 className="font-heading text-2xl text-primary tracking-wide">
            Connect Your Calendar
          </h2>
          <p className="font-mono text-sm text-muted-foreground mt-1 max-w-xl">
            Sync ProGrafter with your Google Calendar, Apple Calendar or Outlook to automatically
            add project dates, update reminders, and payment milestones.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your calendar link…
        </div>
      ) : (
        <>
          {/* The link */}
          <div className="bg-background border-2 border-dashed border-foreground/40 rounded p-4 mb-4">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Your private calendar URL
            </p>
            <code className="block font-mono text-xs md:text-sm text-foreground break-all select-all">
              {feedUrl}
            </code>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded font-mono text-sm hover:bg-primary/90 transition border-2 border-primary shadow-[3px_3px_0_0_hsl(var(--foreground))]"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "✓ Copied!" : "Copy Calendar Link"}
            </button>
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="flex items-center gap-2 bg-card border-2 border-foreground px-5 py-2.5 rounded font-mono text-sm hover:bg-foreground/5 transition disabled:opacity-50"
            >
              {regenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Regenerate
            </button>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg text-primary tracking-wide">
              How to subscribe
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <InstructionCard title="Google Calendar">
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Open Google Calendar</li>
                  <li>Click <b>Other calendars</b> → <b>+</b></li>
                  <li>Choose <b>From URL</b></li>
                  <li>Paste your link</li>
                </ol>
              </InstructionCard>
              <InstructionCard title="Apple Calendar">
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Open Calendar app</li>
                  <li><b>File</b> → <b>New Calendar Subscription</b></li>
                  <li>Paste your link</li>
                  <li>Click <b>Subscribe</b></li>
                </ol>
              </InstructionCard>
              <InstructionCard title="Outlook">
                <ol className="space-y-1 list-decimal list-inside">
                  <li>Open Outlook</li>
                  <li><b>Add calendar</b> → <b>Subscribe from web</b></li>
                  <li>Paste your link</li>
                  <li>Name it "ProGrafter"</li>
                </ol>
              </InstructionCard>
            </div>
          </div>

          <div className="mt-6 bg-secondary/5 border-l-4 border-secondary p-4 rounded-r">
            <p className="font-mono text-xs text-foreground">
              <b>Note:</b> Your calendar will refresh automatically — typically every few hours
              depending on your calendar app. Project starts, stage windows, payment milestones
              and quote deadlines will appear as events.
            </p>
          </div>
        </>
      )}
    </section>
  );
};

const InstructionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-background border-2 border-foreground/20 rounded p-4">
    <h4 className="font-heading text-sm text-primary tracking-wide mb-2">{title}</h4>
    <div className="font-mono text-xs text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

export default CalendarConnect;
