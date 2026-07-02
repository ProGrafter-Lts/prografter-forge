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
import { Upload, FileText, Loader2, ShieldCheck } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

const CHECKER_TYPES = [
  { value: "homeowner", label: "Homeowner checking a builder's quote" },
  { value: "trade_self", label: "Trade checking my own quote before sending it" },
  { value: "trade_sub", label: "Trade checking a subcontractor quote" },
  { value: "other", label: "Other" },
];

const PROJECT_TYPES = [
  "Single-storey extension",
  "Double-storey extension",
  "Loft conversion",
  "Garage conversion",
  "Renovation",
  "Kitchen",
  "Bathroom",
  "Roofing",
  "Electrical",
  "Plumbing / heating",
  "Landscaping",
  "General building",
  "Other",
];

const STAGES = [
  "Idea stage",
  "Drawings prepared",
  "Planning submitted",
  "Planning approved",
  "Building Control involved",
  "Ready to start",
  "Already started",
  "Not sure",
];

const YES_NO_NOTYET = ["Yes", "No", "Not yet"];
const YES_NO_NR_NS = ["Yes", "No", "Not required", "Not sure"];

const EXPECTED_ITEMS = [
  "Groundworks", "Foundations", "Drainage", "Brickwork / blockwork", "Steelwork",
  "Roof", "Windows / doors", "Electrics", "Plumbing", "Heating", "Kitchen",
  "Bathroom", "Plastering", "Flooring", "Decorating", "Waste removal",
  "Building Control", "Structural engineer", "Certificates / warranties", "Not sure",
];

const LABOUR_MATERIAL = ["Labour only", "Materials only", "Labour and materials", "Not sure"];
const NUM_QUOTES = ["1", "2", "3", "4+"];

// Small labelled select used across the optional context sections.
const MiniSelect = ({
  label, value, onChange, options, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) => (
  <div className="space-y-2">
    <Label className="font-mono text-sm text-navy">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="font-mono"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="font-mono">{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const SectionCard = ({
  step, title, subtitle, children, prominent = false,
}: { step: string; title: string; subtitle?: string; children: React.ReactNode; prominent?: boolean }) => (
  <div className={`relative bg-card rounded-2xl border p-6 md:p-8 space-y-5 overflow-hidden ${prominent ? "border-teal/40 shadow-xl shadow-navy/5" : "border-border shadow-sm"}`}>
    {prominent && <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-teal via-teal/70 to-navy" />}
    <div className="pt-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-teal">{step}</span>
      </div>
      <p className="font-heading text-lg text-navy leading-tight">{title}</p>
      {subtitle && <p className="font-mono text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const QuoteCheckerForm = ({ onSubmitted }: { onSubmitted: (id: string, email: string, lookupToken: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [checkerType, setCheckerType] = useState("");
  const [projectType, setProjectType] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  // Section 3 — project basics (all optional)
  const [projectSize, setProjectSize] = useState("");
  const [stage, setStage] = useState("");
  const [hasDrawings, setHasDrawings] = useState("");
  const [hasPlanning, setHasPlanning] = useState("");
  const [hasStructural, setHasStructural] = useState("");
  // Section 4 — expected scope
  const [expectedScope, setExpectedScope] = useState("");
  const [expectedItems, setExpectedItems] = useState<string[]>([]);
  // Section 5 — concerns
  const [concerns, setConcerns] = useState("");
  // Section 6 — price context
  const [quoteTotal, setQuoteTotal] = useState("");
  const [labourMaterial, setLabourMaterial] = useState("");
  const [numQuotes, setNumQuotes] = useState("");

  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freeAvailable, setFreeAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [formParams] = useSearchParams();

  const isTrade = checkerType === "trade_self" || checkerType === "trade_sub";

  useEffect(() => {
    const pt = formParams.get("project_type");
    if (pt) setProjectType(pt);
    const ct = formParams.get("checker_type");
    if (ct) setCheckerType(ct);
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

  const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && ACCEPTED_TYPES.includes(selected.type)) {
      if (selected.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
        return;
      }
      setFile(selected);
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF, JPG, PNG or screenshot. Word docs: save as PDF first.", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 0.1) return `${mb.toFixed(1)}MB`;
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const toggleItem = (item: string) =>
    setExpectedItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));

  const canSubmit = !!file && !!checkerType && !!projectType && !!email && !isSubmitting;

  const handleSubmit = async () => {
    if (!file || !checkerType || !projectType || !email) {
      toast({ title: "A few things needed", description: "Please upload your quote and tell us who's checking it, the project type and your email.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const intake = {
        checker_type: checkerType,
        project_type: projectType,
        postcode,
        project_size: projectSize,
        stage,
        has_drawings: hasDrawings,
        has_planning: hasPlanning,
        has_structural: hasStructural,
        expected_scope: expectedScope,
        expected_items: expectedItems,
        concerns,
        quote_total: quoteTotal,
        labour_material: labourMaterial,
        num_quotes: numQuotes,
      };

      const { data: rpcData, error: insertError } = await supabase.rpc("create_quote_check_v2" as any, {
        _email: email,
        _project_type: projectType,
        _postcode: postcode,
        _description: expectedScope || projectType,
        _pdf_url: fileName,
        _checker_type: checkerType,
        _intake: intake,
      });
      if (insertError) throw insertError;
      const record = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as { id: string; lookup_token: string };
      if (!record?.id) throw new Error("Could not create quote check record");

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
        console.warn("Free entitlement redemption failed, falling back to payment", redeemError);
      }

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-quote-checkout",
        { body: { quoteCheckId: record.id, email, website } }
      );
      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        localStorage.setItem(
          "pendingQuoteCheck",
          JSON.stringify({ id: record.id, email, lookupToken: (record as any).lookup_token }),
        );
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
    <div className="space-y-5">
      {/* SECTION 1 — Upload */}
      <SectionCard step="Step 1" title="Upload your quote" prominent
        subtitle="We'll check what's included, what's unclear, what may be missing, and what questions to ask before you commit.">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-teal/50 transition-colors"
        >
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-teal" />
              <div className="text-left">
                <p className="font-mono text-sm text-navy font-medium">{file.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{formatFileSize(file.size)} — Click to change</p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-mono text-sm text-muted-foreground">Click to upload your quote</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">PDF, image or screenshot — Max 10MB. Quote in Word? Save it as a PDF first.</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* SECTION 2 — Who is checking */}
      <SectionCard step="Step 2" title="Who is checking this quote?"
        subtitle="This tailors the tone and focus of your report.">
        <Select value={checkerType} onValueChange={setCheckerType}>
          <SelectTrigger className="font-mono"><SelectValue placeholder="Select who's checking the quote" /></SelectTrigger>
          <SelectContent>
            {CHECKER_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="font-mono">{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isTrade && (
          <p className="font-mono text-xs text-teal">
            We'll show you how to make your quote clearer, stronger and easier for the customer to approve.
          </p>
        )}
      </SectionCard>

      {/* SECTION 3 — Project basics */}
      <SectionCard step="Step 3" title="Tell us a little about the project"
        subtitle="This helps us understand the quote, but we'll still analyse the document itself first.">
        <div className="grid sm:grid-cols-2 gap-4">
          <MiniSelect label="Project type *" value={projectType} onChange={setProjectType} options={PROJECT_TYPES} placeholder="Select project type" />
          <div className="space-y-2">
            <Label className="font-mono text-sm text-navy">Postcode or nearest town</Label>
            <Input type="text" placeholder="e.g. NG1 or Nottingham" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-sm text-navy">Approximate project size (if known)</Label>
            <Input type="text" placeholder="e.g. 4m x 3m, or ~40 sqm" value={projectSize} onChange={(e) => setProjectSize(e.target.value)} className="font-mono" />
          </div>
          <MiniSelect label="Stage" value={stage} onChange={setStage} options={STAGES} placeholder="Select stage" />
          <MiniSelect label="Do you have drawings?" value={hasDrawings} onChange={setHasDrawings} options={YES_NO_NOTYET} placeholder="Select" />
          <MiniSelect label="Planning approval?" value={hasPlanning} onChange={setHasPlanning} options={YES_NO_NR_NS} placeholder="Select" />
          <MiniSelect label="Structural calculations?" value={hasStructural} onChange={setHasStructural} options={YES_NO_NR_NS} placeholder="Select" />
        </div>
      </SectionCard>

      {/* SECTION 4 — What did you ask for */}
      <SectionCard step="Step 4"
        title={isTrade ? "What was this quote meant to cover?" : "What did you ask the builder to include?"}
        subtitle="This helps us compare what you expected against what the quote actually says. We still treat the quote as the source of truth.">
        <textarea
          placeholder="Example: single-storey rear extension, knock-through, kitchen area, electrics, plumbing, plastering, flooring, decorating, waste removal and Building Control."
          value={expectedScope} onChange={(e) => setExpectedScope(e.target.value)} rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-none"
        />
        <div>
          <p className="font-mono text-xs text-muted-foreground mb-2">Tick anything you expected or want checked (this won't be assumed as included):</p>
          <div className="flex flex-wrap gap-2">
            {EXPECTED_ITEMS.map((item) => {
              const on = expectedItems.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleItem(item)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${on ? "bg-teal text-white border-teal" : "bg-background text-muted-foreground border-border hover:border-teal/50"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* SECTION 5 — Concerns */}
      <SectionCard step="Step 5" title="Is there anything you're worried about?">
        <textarea
          placeholder="Example: one quote is much cheaper than the others, I'm not sure if electrics are included, payment terms seem unclear."
          value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={2}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-none"
        />
      </SectionCard>

      {/* SECTION 6 — Price context */}
      <SectionCard step="Step 6" title="Price context (optional)">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-mono text-sm text-navy">Quote total</Label>
            <Input type="text" placeholder="e.g. £42,000" value={quoteTotal} onChange={(e) => setQuoteTotal(e.target.value)} className="font-mono" />
          </div>
          <MiniSelect label="Is the quote…" value={labourMaterial} onChange={setLabourMaterial} options={LABOUR_MATERIAL} placeholder="Select" />
          <MiniSelect label="How many quotes have you received?" value={numQuotes} onChange={setNumQuotes} options={NUM_QUOTES} placeholder="Select" />
        </div>
      </SectionCard>

      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <label htmlFor="website">Website (leave blank)</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-4 shadow-sm">
        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">Email Address *</Label>
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" />
          <p className="font-mono text-xs text-muted-foreground">Your report will be delivered here.</p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-12 bg-teal text-white font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20 disabled:bg-muted disabled:text-muted-foreground/70 disabled:shadow-none disabled:opacity-100"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{freeAvailable ? "Starting your free check..." : "Preparing checkout..."}</span>
          ) : (
            freeAvailable ? "Check My Quote — Free" : "Check My Quote — £49"
          )}
        </Button>
        <p className="text-center font-mono text-[11px] text-muted-foreground leading-relaxed">
          This report helps you understand and compare quotes. It is guidance only and does not replace professional advice, surveys, structural design or legal advice.
        </p>
        <p className="text-center font-mono text-xs text-muted-foreground">Secure payment via Stripe. Report usually ready in 2–5 minutes.</p>
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

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const quoteId = searchParams.get("quote_id");
    const cancelled = searchParams.get("cancelled");

    if (cancelled) {
      toast({ title: "Payment cancelled", description: "Your quote check was not processed.", variant: "destructive" });
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
          console.error("[QuoteChecker] verify-quote-payment failed", err);
          // The analysis may still be running / completed in the background.
          // If we have a secure token, send the user to the report page so its
          // poller can pick up the report once it's ready, rather than stranding
          // them here.
          const stored = localStorage.getItem("pendingQuoteCheck");
          const parsed = stored ? (() => { try { return JSON.parse(stored); } catch { return {}; } })() : {};
          const fallbackToken = parsed.lookupToken || "";
          if (fallbackToken) {
            localStorage.removeItem("pendingQuoteCheck");
            goToReport(quoteId, fallbackToken);
          } else {
            toast({ title: "Verification failed", description: err.message || "Please contact support.", variant: "destructive" });
          }
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
          title="Quote Health Check — ProGrafter | Read Your Building Quote for £49"
          description="We help you read the quotes you've got — where the gaps are, what to ask, and what good looks like. £49 one-off."
          path="/quote-checker"
          jsonLd={buildServiceJsonLd({
            name: "Quote Health Check",
            description: "An independent, plain-English review of your UK building quote to help you read it and ask the right questions.",
            url: "https://prografter.co.uk/quote-checker",
            serviceType: "Construction quote review",
            price: "49.00",
          })}
        />
        <div className="relative overflow-hidden bg-navy bg-gradient-to-br from-navy via-navy to-[hsl(var(--teal)/0.4)] pt-28 pb-32 px-6">
          <div className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-teal/20 blur-3xl" />
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-teal-foreground font-mono text-xs px-3 py-1.5 rounded-full mb-5 backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Quote Health Check — £49
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-white mb-4 leading-[1.05]">
              Quote Health{" "}
              <span className="bg-gradient-to-r from-teal to-[hsl(var(--teal))] bg-clip-text text-transparent">Check</span>
            </h1>
            <p className="text-white/75 font-mono text-sm max-w-md mx-auto leading-relaxed">
              We don't quote your job. We help you read the quotes you've got — where the gaps are, what to ask, and what good looks like. <span className="font-semibold text-white">£49.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["✓ Quote Quality Score", "✓ Plain-English review", "✓ Questions to ask", "✓ Usually ready in 2–5 mins"].map((t) => (
                <span key={t} className="font-mono text-xs text-white/90 bg-white/8 border border-white/15 px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
            <p className="font-mono text-xs text-white/70 mt-6">
              Don't have a quote yet?{" "}
              <a href="/quote-checker-ai" className="text-teal-foreground underline underline-offset-2 hover:text-white">Start with the free Project Cost Guide.</a>
            </p>
          </div>
        </div>

        <div className="pb-16 px-6">
          <div className="max-w-2xl mx-auto -mt-16 relative z-10">
            <QuoteCheckerForm onSubmitted={(id, _email, lookupToken) => goToReport(id, lookupToken)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default QuoteChecker;
