import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { buildServiceJsonLd } from "@/lib/seoSchemas";
import { Upload, FileText, Loader2, ShieldCheck, AlertTriangle, Check } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";


const PROJECT_TYPES = [
  "Rear Extension",
  "Loft Conversion",
  "Full Rewire",
  "Bathroom",
  "Kitchen",
  "Boiler/Heating Replacement",
  "New Build",
  "Roofing",
  "Other",
];


const QuoteCheckerForm = ({ onSubmitted }: { onSubmitted: (id: string, email: string, lookupToken: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [projectType, setProjectType] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freeAvailable, setFreeAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [formParams] = useSearchParams();

  // Prefill project type from the dashboard deep-link, and detect a free
  // quote-check entitlement for the signed-in homeowner.
  useEffect(() => {
    const pt = formParams.get("project_type");
    if (pt) setProjectType(pt);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) setEmail(user.email);
      const { data: ent } = await supabase
        .from("quote_check_entitlements" as any)
        .select("id")
        .eq("user_id", user.id)
        .is("consumed_at", null)
        .limit(1);
      setFreeAvailable(((ent as any) || []).length > 0);
    })();
  }, [formParams]);


  const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && ACCEPTED_TYPES.includes(selected.type)) {
      if (selected.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
        return;
      }
      setFile(selected);
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF, JPG or PNG file.", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 0.1) return `${mb.toFixed(1)}MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)}KB`;
  };

  const handleSubmit = async () => {
    if (!file || !projectType || !email || description.length < 30) {
      toast({ title: "Missing fields", description: "Please fill in all required fields. Description must be at least 30 characters.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload file (preserve original content type so it isn't forced to PDF)
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      // Create record via a security-definer RPC so the lookup token can be
      // returned without granting public SELECT on the quote_checks table.
      const { data: rpcData, error: insertError } = await supabase.rpc("create_quote_check" as any, {
        _email: email,
        _project_type: projectType,
        _postcode: postcode,
        _description: description,
        _pdf_url: fileName,
      });
      if (insertError) throw insertError;
      const record = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as { id: string; lookup_token: string };
      if (!record?.id) throw new Error("Could not create quote check record");

      // Free entitlement path — skip Stripe entirely.
      if (freeAvailable) {
        const { data: redeemData, error: redeemError } = await supabase.functions.invoke(
          "redeem-quote-check-entitlement",
          { body: { quoteCheckId: record.id } }
        );
        if (!redeemError && (redeemData as any)?.redeemed) {
          trackEvent("quote_check", { method: "free_entitlement" });
          setFreeAvailable(false);
          onSubmitted(record.id, email, (record as any).lookup_token);
          return;
        }
        // If redemption failed, fall through to the paid flow.
        console.warn("Free entitlement redemption failed, falling back to payment", redeemError);
      }

      // Create Stripe checkout session (passes honeypot through)
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-quote-checkout",
        { body: { quoteCheckId: record.id, email, website } }
      );
      if (checkoutError) throw checkoutError;


      if (checkoutData?.url) {
        // Store quote ID + lookup token for when they return
        localStorage.setItem(
          "pendingQuoteCheck",
          JSON.stringify({ id: record.id, email, lookupToken: (record as any).lookup_token }),
        );
        // Try top-frame navigation (works on published site); fall back to new tab
        // so the Lovable preview iframe doesn't go blank when Stripe blocks embedding.
        try {
          if (window.top && window.top !== window.self) {
            window.open(checkoutData.url, "_blank", "noopener,noreferrer");
          } else {
            window.location.href = checkoutData.url;
          }
        } catch {
          window.open(checkoutData.url, "_blank", "noopener,noreferrer");
        }
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Something went wrong", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6 shadow-sm">
        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">Quote PDF *</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-teal/50 transition-colors"
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-teal" />
                <div className="text-left">
                  <p className="font-mono text-sm text-navy font-medium">{file.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatFileSize(file.size)} — Click to change
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-mono text-sm text-muted-foreground">Click to upload your quote</p>
                <p className="font-mono text-xs text-muted-foreground mt-1">PDF, JPG or PNG — Max 10MB. Quote sent as a Word doc? Save it as a PDF first.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">Project Type *</Label>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger className="font-mono"><SelectValue placeholder="Select project type" /></SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="font-mono">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">Postcode</Label>
          <Input type="text" placeholder="e.g. NG1 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="font-mono" />
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">What did you ask to be quoted for? *</Label>
          <textarea
            placeholder="e.g. Single storey rear extension, 4m x 3m, with bi-fold doors..."
            value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-none"
          />
          {description.length < 30 ? (
            <p className="font-mono text-xs text-muted-foreground">Minimum 30 characters ({description.length}/30)</p>
          ) : description.length === 30 ? (
            <p className="font-mono text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Description looks good
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">Email Address *</Label>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" />
          <p className="font-mono text-xs text-muted-foreground">Your report will be delivered here.</p>
        </div>

        {/* Honeypot — hidden from real users, bots will fill it */}
        <div
          aria-hidden="true"
          style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
        >
          <label htmlFor="website">Website (leave blank)</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !file || !projectType || !email || description.length < 30}
          className="w-full h-12 bg-teal text-white font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20 disabled:bg-muted disabled:text-muted-foreground/70 disabled:shadow-none disabled:opacity-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{freeAvailable ? "Starting your free check..." : "Preparing checkout..."}</span>
          ) : (
            freeAvailable ? "Run My Free Quote Check" : "Check My Quote — £49"
          )}
        </Button>
        <p className="text-center font-mono text-[11px] italic text-muted-foreground/80 leading-relaxed">
          This report is AI-generated guidance only and does not constitute a professional survey or valuation. ProGrafter accepts no liability for decisions made based on this report.
        </p>
        <p className="text-center font-mono text-xs text-muted-foreground">
          Secure payment via Stripe. Your report is generated in under 60 seconds.
        </p>
      </div>
    </div>
  );
};



const QuoteChecker = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);

  const goToReport = (id: string, lookupToken: string) => {
    navigate(`/report/${id}?t=${encodeURIComponent(lookupToken)}`);
  };


  // Handle return from Stripe checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const quoteId = searchParams.get("quote_id");
    const cancelled = searchParams.get("cancelled");

    if (cancelled) {
      toast({ title: "Payment cancelled", description: "Your quote check was not processed.", variant: "destructive" });
      // Clean URL
      window.history.replaceState({}, "", "/quote-checker");
      return;
    }

    if (sessionId && quoteId) {
      setVerifying(true);
      const verify = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("verify-quote-payment", {
            body: { sessionId, quoteCheckId: quoteId },
          });
          if (error) throw error;
          if (data?.paid) {
            const stored = localStorage.getItem("pendingQuoteCheck");
            const parsed = stored ? JSON.parse(stored) : {};
            // Prefer values returned by the server; fall back to localStorage.
            const email = data.email || parsed.email || "";
            const lookupToken = data.lookupToken || parsed.lookupToken || "";
            localStorage.removeItem("pendingQuoteCheck");
            if (!lookupToken) {
              toast({
                title: "Session expired",
                description: "We couldn't find your secure access token. Please check your email for the report link.",
                variant: "destructive",
              });
              window.history.replaceState({}, "", "/quote-checker");
              return;
            }
            trackEvent("quote_check", { method: "paid" });
            goToReport(quoteId, lookupToken);
          } else {
            toast({ title: "Payment not confirmed", description: "Please try again.", variant: "destructive" });
          }
        } catch (err: any) {
          console.error(err);
          toast({ title: "Verification failed", description: err.message || "Please contact support.", variant: "destructive" });
        } finally {
          setVerifying(false);
        }
      };
      verify();
    }
  }, [searchParams, toast]);

  if (verifying) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <div className="pt-24 pb-16 px-6">
            <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
              <Loader2 className="mx-auto h-10 w-10 text-teal animate-spin" />
              <h2 className="font-heading text-2xl text-navy">Confirming your payment…</h2>
              <p className="font-mono text-sm text-muted-foreground">Please wait while we verify your payment and start your analysis.</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <SEO
          title="AI Quote Checker — ProGrafter | Check Any Building Quote for £49"
          description="Upload any building quote and our AI checks it against industry benchmarks. £49 one-off, no signup required."
          path="/quote-checker"
          jsonLd={buildServiceJsonLd({
            name: "AI Quote Checker",
            description: "AI-powered review of any UK building quote against a 43-point checklist.",
            url: "https://prografter.co.uk/quote-checker",
            serviceType: "Construction quote review",
            price: "49.00",
          })}
        />
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-teal/10 text-teal font-mono text-xs px-3 py-1.5 rounded-full mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                43-Point Quote Analysis
              </div>
              <h1 className="font-heading text-4xl md:text-5xl text-navy mb-3">AI Quote Checker</h1>
              <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto leading-relaxed">
                Upload any building quote. Our AI checks it against a 43-point checklist and tells you exactly what's missing. Report in your inbox within 2 minutes. <span className="font-semibold text-navy">£49.</span>
              </p>
            </div>

            <QuoteCheckerForm onSubmitted={(id, _email, lookupToken) => goToReport(id, lookupToken)} />

          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default QuoteChecker;
