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
import TrustSignal from "@/components/TrustSignal";
import { buildServiceJsonLd } from "@/lib/seoSchemas";
import { Upload, FileText, Loader2, ShieldCheck } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Public-facing project types. Values map to the fixed-standard trades in the
// backend (extension / rewire / bathroom / boiler); "Other" -> general guidance.
const PROJECT_TYPES = [
  { value: "Single-storey extension", label: "Extension" },
  { value: "Full rewire", label: "Rewire" },
  { value: "Bathroom", label: "Bathroom" },
  { value: "Boiler / heating replacement", label: "Boiler / Heating" },
  { value: "Other", label: "Something else" },
];

const BASIS = ["Drawings", "A site visit", "Photos", "A written description", "Not sure"];
const BC_STATUS = ["Included in the quote", "Arranged separately", "Not sure"];
const YES_NO_UNSURE = ["Yes", "No", "Not sure"];

// Simple labelled select.
const AskSelect = ({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) => (
  <div className="space-y-2">
    <Label className="font-mono text-sm text-navy leading-snug">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="font-mono"><SelectValue placeholder="Select an answer" /></SelectTrigger>
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
      <span className="font-mono text-[10px] uppercase tracking-wider text-teal">{step}</span>
      <p className="font-heading text-lg text-navy leading-tight">{title}</p>
      {subtitle && <p className="font-mono text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const SimpleQuoteCheckerForm = ({ onSubmitted }: { onSubmitted: (id: string, email: string, lookupToken: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [projectType, setProjectType] = useState("");
  const [email, setEmail] = useState("");

  // Simple homeowner context (all used only to determine relevance).
  const [basis, setBasis] = useState("");
  const [buildingControl, setBuildingControl] = useState("");
  const [expectElectrics, setExpectElectrics] = useState("");
  const [expectPlumbing, setExpectPlumbing] = useState("");
  const [expectHeating, setExpectHeating] = useState("");
  const [expectPlastering, setExpectPlastering] = useState("");
  const [expectFinishes, setExpectFinishes] = useState("");
  const [opensUpHouse, setOpensUpHouse] = useState("");
  const [paymentStages, setPaymentStages] = useState("");
  const [timescale, setTimescale] = useState("");
  const [verbalAgreements, setVerbalAgreements] = useState("");

  const [website, setWebsite] = useState(""); // honeypot
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freeAvailable, setFreeAvailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const supportingInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [formParams] = useSearchParams();

  const isExtension = projectType === "Single-storey extension" || /extension/i.test(projectType);

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

  const canSubmit = !!file && !!projectType && !!email && !isSubmitting;

  const handleSubmit = async () => {
    if (!file || !projectType || !email) {
      toast({ title: "A few things needed", description: "Please upload your quote, choose the project type and enter your email.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      // Turn simple "expected" answers into the relevance list the backend uses.
      // Only "Yes" adds an item — "No" / "Not sure" never assumes it's included.
      const expectedItems: string[] = [];
      if (expectElectrics === "Yes") expectedItems.push("Electrics");
      if (expectPlumbing === "Yes") expectedItems.push("Plumbing");
      if (expectHeating === "Yes") expectedItems.push("Heating");
      if (expectPlastering === "Yes") expectedItems.push("Plastering");
      if (expectFinishes === "Yes") expectedItems.push("Kitchen", "Bathroom", "Flooring", "Decorating");
      if (buildingControl === "Included in the quote") expectedItems.push("Building Control");

      const intake = {
        mode: "simple",
        checker_type: "homeowner",
        project_type: projectType,
        has_drawings: basis === "Drawings" ? "Yes" : basis === "Not sure" ? "Not sure" : "No",
        expected_items: expectedItems,
        building_control_status: buildingControl,
        // Full plain-English context preserved for the backend + audit trail.
        simple_context: {
          basis,
          building_control: buildingControl,
          expect_electrics: expectElectrics,
          expect_plumbing: expectPlumbing,
          expect_heating: expectHeating,
          expect_plastering: expectPlastering,
          expect_finishes: expectFinishes,
          opens_up_house: opensUpHouse,
          payment_stages_given: paymentStages,
          timescale_given: timescale,
          verbal_agreements: verbalAgreements,
        },
      };

      const { data: rpcData, error: insertError } = await supabase.rpc("create_quote_check_v2" as any, {
        _email: email,
        _project_type: projectType,
        _postcode: "",
        _description: projectType,
        _pdf_url: fileName,
        _checker_type: "homeowner",
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
      {/* STEP 1 — Upload + project type */}
      <SectionCard step="Step 1" title="Upload your quote" prominent
        subtitle="We'll check what's clear, what's unclear, what appears missing, and what to ask before you accept.">
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
        <div className="space-y-2">
          <Label className="font-mono text-sm text-navy">What type of project is this quote for? *</Label>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger className="font-mono"><SelectValue placeholder="Select the project type" /></SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="font-mono">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {/* STEP 2 — Simple context */}
      {projectType && (
        <SectionCard step="Step 2" title="A few quick questions"
          subtitle="These just help us know what's relevant to your job. If you don't expect something, we won't mark the quote down for leaving it out.">
          <div className="grid sm:grid-cols-2 gap-4">
            <AskSelect label="Was this quote based on…" value={basis} onChange={setBasis} options={BASIS} />
            <AskSelect label="Is Building Control arranged or included?" value={buildingControl} onChange={setBuildingControl} options={BC_STATUS} />
            {isExtension && (
              <>
                <AskSelect label="Do you expect electrics to be included?" value={expectElectrics} onChange={setExpectElectrics} options={YES_NO_UNSURE} />
                <AskSelect label="Do you expect plumbing to be included?" value={expectPlumbing} onChange={setExpectPlumbing} options={YES_NO_UNSURE} />
                <AskSelect label="Do you expect heating or gas work to be included?" value={expectHeating} onChange={setExpectHeating} options={YES_NO_UNSURE} />
                <AskSelect label="Do you expect plastering to be included?" value={expectPlastering} onChange={setExpectPlastering} options={YES_NO_UNSURE} />
                <AskSelect label="Do you expect decorating, flooring, kitchen/bathroom fittings or tiling to be included?" value={expectFinishes} onChange={setExpectFinishes} options={YES_NO_UNSURE} />
                <AskSelect label="Does the work involve opening up the existing house or removing walls?" value={opensUpHouse} onChange={setOpensUpHouse} options={YES_NO_UNSURE} />
              </>
            )}
            <AskSelect label="Has the builder given you payment stages separately?" value={paymentStages} onChange={setPaymentStages} options={YES_NO_UNSURE} />
            <AskSelect label="Has the builder given you a start date or rough timescale separately?" value={timescale} onChange={setTimescale} options={YES_NO_UNSURE} />
            <AskSelect label="Are there any verbal agreements not written in the quote?" value={verbalAgreements} onChange={setVerbalAgreements} options={YES_NO_UNSURE} />
          </div>
        </SectionCard>
      )}

      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}>
        <label htmlFor="website">Website (leave blank)</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {/* STEP 3 — Email + submit */}
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
          This report helps you understand your quote. It is guidance only and does not replace professional advice, surveys, structural design or legal advice.
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
          title="Quote Checker — ProGrafter | Check a Builder's Quote for £49"
          description="Upload a builder's quote and we'll check what's clear, what's unclear, what appears missing and what to ask before you accept. Plain-English report in minutes."
          path="/quote-checker"
          jsonLd={buildServiceJsonLd({
            name: "Quote Checker",
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
              Quote Checker — £49
            </div>
            <h1 className="font-heading text-4xl md:text-6xl text-white mb-4 leading-[1.05]">
              Quote{" "}
              <span className="bg-gradient-to-r from-teal to-[hsl(var(--teal))] bg-clip-text text-transparent">Checker</span>
            </h1>
            <p className="text-white/75 font-mono text-sm max-w-md mx-auto leading-relaxed">
              Upload a quote and we'll tell you what's clear, what's unclear, what appears missing, and what to ask before you accept. <span className="font-semibold text-white">£49.</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["✓ Quote Clarity Score", "✓ Plain-English review", "✓ Questions to ask", "✓ Usually ready in 2–5 mins"].map((t) => (
                <span key={t} className="font-mono text-xs text-white/90 bg-white/8 border border-white/15 px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
            <p className="font-mono text-xs text-white/70 mt-6">
              Don't have a quote yet?{" "}
              <a href="/quote-checker-ai" className="text-teal-foreground underline underline-offset-2 hover:text-white">Start with the free Project Cost Guide.</a>
            </p>
            <TrustSignal tone="light" className="mt-6" text="Independent, construction-aware analysis — never a sales pitch." />
          </div>
        </div>

        <div className="pb-16 px-6">
          <div className="max-w-2xl mx-auto -mt-16 relative z-10">
            <SimpleQuoteCheckerForm onSubmitted={(id, _email, lookupToken) => goToReport(id, lookupToken)} />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default QuoteChecker;
