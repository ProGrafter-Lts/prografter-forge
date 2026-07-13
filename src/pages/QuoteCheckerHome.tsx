import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import SimpleQuoteChecker from "@/pages/SimpleQuoteChecker";
import BoilerQuoteChecker from "@/pages/BoilerQuoteChecker";
import ElectricalQuoteChecker from "@/pages/ElectricalQuoteChecker";
import BathroomQuoteChecker from "@/pages/BathroomQuoteChecker";
import RoofingQuoteChecker from "@/pages/RoofingQuoteChecker";
import {
  QUOTE_CHECKER_MODULES,
  type QuoteCheckerModule,
} from "@/lib/quoteCheckerModules";
import { ShieldCheck, ArrowRight, ArrowLeft, Clock, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

type View = "select" | "coming_soon" | "manual" | "manual_done";

const QuoteCheckerHome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const activeModuleId = searchParams.get("module");

  const [view, setView] = useState<View>("select");
  const [selected, setSelected] = useState<QuoteCheckerModule | null>(null);


  // Manual review form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When a module is selected via the query param, load the working checker
  // for that module inline inside the AI Quote Checker flow. This reuses the
  // existing checker logic without rebuilding or altering it.
  if (activeModuleId === "extension_building") {
    return <SimpleQuoteChecker />;
  }
  if (activeModuleId === "boiler_heating") {
    return <BoilerQuoteChecker />;
  }
  if (activeModuleId === "electrical_rewire") {
    return <ElectricalQuoteChecker />;
  }
  if (activeModuleId === "bathroom") {
    return <BathroomQuoteChecker />;
  }
  if (activeModuleId === "roofing") {
    return <RoofingQuoteChecker />;
  }


  const handleSelect = (m: QuoteCheckerModule) => {
    setSelected(m);
    if (m.status === "active" && m.route_or_component) {
      navigate(m.route_or_component);
      return;
    }
    setView("coming_soon");
  };

  const resetToSelect = () => {
    setView("select");
    setSelected(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast({ title: "Invalid file", description: "Please upload a PDF, JPG, PNG or screenshot.", variant: "destructive" });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const submitManual = async () => {
    if (!name || !email) {
      toast({ title: "A few things needed", description: "Please enter your name and email.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;
      if (file) {
        const path = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("quote-pdfs")
          .upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) throw upErr;
        filePath = path;
        fileName = file.name;
      }

      const { error } = await supabase.from("manual_quote_review_requests").insert({
        quote_type: selected?.short_label ?? "Unknown",
        name,
        email,
        phone: phone || null,
        file_path: filePath,
        file_name: fileName,
        note: note || null,
      });
      if (error) throw error;

      setView("manual_done");
    } catch (err) {
      console.error(err);
      toast({ title: "Something went wrong", description: "We couldn't submit your request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <SEO
        title="Quote Checker | Check Any Trade Quote Before You Accept | ProGrafter"
        description="Choose the type of work you're checking and ProGrafter will review whether the quote clearly explains the scope, cost, exclusions, risks and questions to ask before accepting."
        path="/quote-checker"
      />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-10 md:pt-28 md:pb-16 space-y-6">
        {/* ---------------------------------------------------------------- */}
        {/* SELECT VIEW                                                       */}
        {/* ---------------------------------------------------------------- */}
        {view === "select" && (
          <>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1">
                <ShieldCheck className="h-4 w-4 text-teal" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-teal">Quote Checker</span>
              </div>
              <h1 className="font-heading text-2xl md:text-3xl text-navy">What type of quote are you checking?</h1>
              <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto">
                Every job deserves a clear quote. Choose the type of work you're checking and ProGrafter will
                review whether the quote clearly explains the scope, cost, exclusions, risks and questions to ask
                before accepting.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {QUOTE_CHECKER_MODULES.map((m) => {
                const active = m.status === "active";
                return (
                  <button
                    key={m.module_id}
                    onClick={() => handleSelect(m)}
                    className={`group text-left rounded-2xl border p-5 transition-all ${
                      active
                        ? "border-teal bg-teal/5 hover:bg-teal/10 hover:-translate-y-0.5"
                        : "border-border bg-card hover:border-teal/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-heading text-base text-navy leading-snug">{m.short_label}</span>
                      {active ? (
                        <ArrowRight className="h-4 w-4 text-teal shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" /> Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-muted-foreground leading-snug">{m.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="font-mono text-xs text-muted-foreground">
                Whether it's a boiler, rewire, bathroom or extension, trust starts with understanding what
                you're paying for.
              </p>
            </div>
          </>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* COMING SOON VIEW                                                  */}
        {/* ---------------------------------------------------------------- */}
        {view === "coming_soon" && selected && (
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5 shadow-sm text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 mx-auto">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {selected.short_label}
              </span>
            </div>
            <h1 className="font-heading text-2xl text-navy">This quote checker is coming soon.</h1>
            <p className="font-mono text-sm text-muted-foreground max-w-lg mx-auto">
              ProGrafter is starting with extension and structural building quotes. Boiler, heating, electrical,
              bathroom, roofing and other trade-specific quote checks are coming next.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="outline" onClick={resetToSelect} className="font-mono text-sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to quote type selection
              </Button>
              <Button onClick={() => setView("manual")} className="bg-teal text-white hover:bg-teal-hover font-mono text-sm">
                Request manual ProGrafter review
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MANUAL REVIEW FORM VIEW                                           */}
        {/* ---------------------------------------------------------------- */}
        {view === "manual" && selected && (
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5 shadow-sm">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-teal">Manual review</span>
              <h1 className="font-heading text-xl text-navy leading-tight">Request a manual ProGrafter review</h1>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                For {selected.short_label.toLowerCase()} quotes. A member of the ProGrafter team will review your
                quote and get back to you.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-sm text-navy">Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-sm text-navy">Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-sm text-navy">Phone <span className="text-muted-foreground">(optional)</span></Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-sm text-navy">Quote type</Label>
                <Input value={selected.short_label} disabled className="font-mono" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-sm text-navy">Upload quote <span className="text-muted-foreground">(optional)</span></Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-teal/50 transition-colors"
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-6 w-6 text-teal" />
                    <span className="font-mono text-sm text-navy">{file.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                    <p className="font-mono text-xs text-muted-foreground">Click to upload — PDF, image or screenshot, max 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-sm text-navy">Short note <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="font-mono text-sm" placeholder="Anything you'd like us to know about the job or the quote." />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
              <Button variant="outline" onClick={() => setView("coming_soon")} className="font-mono text-sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={submitManual} disabled={submitting} className="bg-teal text-white hover:bg-teal-hover font-mono text-sm">
                {submitting ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Submitting…</span>
                ) : (
                  "Submit review request"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* MANUAL DONE VIEW                                                  */}
        {/* ---------------------------------------------------------------- */}
        {view === "manual_done" && (
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5 shadow-sm text-center">
            <CheckCircle2 className="h-12 w-12 text-teal mx-auto" />
            <h1 className="font-heading text-2xl text-navy">Request received</h1>
            <p className="font-mono text-sm text-muted-foreground max-w-lg mx-auto">
              Thanks — the ProGrafter team will review your quote and be in touch by email. We'll let you know as
              soon as your quote type's automated checker is ready too.
            </p>
            <Button variant="outline" onClick={resetToSelect} className="font-mono text-sm mx-auto">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to quote type selection
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default QuoteCheckerHome;
