import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { Upload, FileText, Loader2, ShieldCheck } from "lucide-react";

// ---- Option sets ------------------------------------------------------------
const PROJECT_TYPES = [
  { value: "Domestic extension", label: "Domestic extension" },
  { value: "Other", label: "Something else" },
];
const FINISH = ["Shell only", "Watertight shell", "Plastered finish", "Full finish", "Not sure"];
const YES_NO_UNSURE = ["Yes", "No", "Not sure"];
const BC_STATUS = [
  "Yes, already arranged",
  "Included in the builder's quote",
  "Architect/designer is dealing with it",
  "Not arranged yet",
  "Not sure",
];
const QUANTITIES = ["Yes, I know the quantities", "No, not yet", "Not sure"];
const PLUMB_HEAT = ["Plumbing only", "Heating/radiators", "Both", "No", "Not sure"];
const DECO = ["Decoration", "Flooring", "Tiling", "Multiple", "No", "Not sure"];

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
  step, title, subtitle, children,
}: { step: string; title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5 shadow-sm">
    <div>
      <span className="font-mono text-[10px] uppercase tracking-wider text-teal">{step}</span>
      <p className="font-heading text-lg text-navy leading-tight">{title}</p>
      {subtitle && <p className="font-mono text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const SimpleQuoteChecker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [projectType, setProjectType] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scope answers
  const [finish, setFinish] = useState("");
  const [demolition, setDemolition] = useState("");
  const [testDig, setTestDig] = useState("");
  const [foundationsConfirmed, setFoundationsConfirmed] = useState("");
  const [buildingControl, setBuildingControl] = useState("");
  const [opensUp, setOpensUp] = useState("");
  const [structuralCalcs, setStructuralCalcs] = useState("");
  const [electrics, setElectrics] = useState("");
  const [electricsQty, setElectricsQty] = useState("");
  const [plumbHeat, setPlumbHeat] = useState("");
  const [plastering, setPlastering] = useState("");
  const [joinery, setJoinery] = useState("");
  const [decoration, setDecoration] = useState("");
  const [paymentStages, setPaymentStages] = useState("");
  const [timescale, setTimescale] = useState("");
  const [verbalAgreements, setVerbalAgreements] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);

  const isExtension = projectType === "Domestic extension";

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

  const handleSupportingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const valid: File[] = [];
    for (const f of picked) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast({ title: "Skipped a file", description: `${f.name}: only PDF, JPG, PNG or screenshots are supported.`, variant: "destructive" });
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${f.name} is over 10MB.`, variant: "destructive" });
        continue;
      }
      valid.push(f);
    }
    setSupportingFiles((prev) => [...prev, ...valid].slice(0, 10));
    if (supportingInputRef.current) supportingInputRef.current.value = "";
  };

  const removeSupporting = (idx: number) =>
    setSupportingFiles((prev) => prev.filter((_, i) => i !== idx));

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 0.1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  const canSubmit = !!file && !!projectType && !!email && !isSubmitting;

  const handleSubmit = async () => {
    if (!file || !projectType || !email) {
      toast({ title: "A few things needed", description: "Please upload your quote, choose the project type and enter your email.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileName = `simple-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const supportingUploaded: { path: string; name: string }[] = [];
      for (const sf of supportingFiles.slice(0, 10)) {
        const spName = `simple-${Date.now()}-support-${Math.random().toString(36).slice(2, 8)}-${sf.name}`;
        const { error: spErr } = await supabase.storage
          .from("quote-pdfs")
          .upload(spName, sf, { contentType: sf.type || "application/octet-stream" });
        if (spErr) { console.warn("supporting upload failed", sf.name, spErr); continue; }
        supportingUploaded.push({ path: spName, name: sf.name });
      }

      const { data: { user } } = await supabase.auth.getUser();

      const intake = {
        checker: "simple",
        project_type: projectType,
        simple_context: {
          finish_level: finish,
          demolition_expected: demolition,
          test_dig_done: testDig,
          foundation_depths_confirmed: foundationsConfirmed,
          building_control: buildingControl,
          opens_up_existing_house: opensUp,
          structural_calcs_available: structuralCalcs,
          electrics_expected: electrics,
          electrics_quantities_known: electricsQty,
          plumbing_heating_expected: plumbHeat,
          plastering_expected: plastering,
          second_fix_joinery_expected: joinery,
          decoration_flooring_tiling: decoration,
          payment_stages_supplied_separately: paymentStages,
          timescale_supplied_separately: timescale,
          verbal_agreements: verbalAgreements,
        },
      };

      const { data, error } = await supabase.functions.invoke("analyse-simple-quote", {
        body: {
          email,
          projectType,
          intake,
          pdfPath: fileName,
          supportingFiles: supportingUploaded,
          userId: user?.id ?? null,
        },
      });
      if (error) throw error;
      if (!data?.id || !data?.lookupToken) throw new Error("No report returned.");

      navigate(`/simple-quote-report/${data.id}?t=${encodeURIComponent(data.lookupToken)}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Something went wrong", description: "We couldn't check your quote. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <SEO
        title="Simple Quote Checker | Check a Builder's Extension Quote | ProGrafter"
        description="Upload a builder's extension quote and ProGrafter checks whether it clearly covers the works you expect, what's missing, and what to ask before you accept."
        path="/simple-quote-checker"
      />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-10 md:pt-28 md:pb-16 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1">
            <ShieldCheck className="h-4 w-4 text-teal" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-teal">Simple Quote Checker</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-navy">Is your builder's quote clear enough?</h1>
          <p className="font-mono text-sm text-muted-foreground max-w-lg mx-auto">
            Upload a builder's quote and we'll check whether it clearly covers the works you expect, what appears missing,
            and what to ask the builder before you accept.
          </p>
        </div>

        {/* STEP 1 — Upload */}
        <SectionCard step="Step 1" title="Upload the builder's quote" subtitle="PDF, image or screenshot — max 10MB. Quote in Word? Save it as a PDF first.">
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
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-sm text-navy">Supporting documents <span className="text-muted-foreground">(optional)</span></Label>
            <p className="font-mono text-xs text-muted-foreground">Add a payment schedule, drawings, spec or builder emails. Used only as supporting context.</p>
            <div
              onClick={() => supportingInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-teal/50 transition-colors"
            >
              <input ref={supportingInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={handleSupportingChange} className="hidden" />
              <p className="font-mono text-xs text-muted-foreground">Click to add — up to 10, max 10MB each</p>
            </div>
            {supportingFiles.length > 0 && (
              <ul className="space-y-1.5">
                {supportingFiles.map((sf, i) => (
                  <li key={`${sf.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-teal shrink-0" />
                      <span className="font-mono text-xs text-navy truncate">{sf.name}</span>
                    </span>
                    <button type="button" onClick={() => removeSupporting(i)} className="font-mono text-[10px] text-muted-foreground hover:text-navy shrink-0">Remove</button>
                  </li>
                ))}
              </ul>
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
            {projectType && !isExtension && (
              <p className="font-mono text-xs text-amber-600">
                This simplified checker is currently optimised for domestic extension quotes.
              </p>
            )}
          </div>
        </SectionCard>

        {/* STEP 2 — Scope questions */}
        {isExtension && (
          <SectionCard step="Step 2" title="A few quick questions about your job"
            subtitle="These help us know what's relevant. If you don't expect something, we won't mark the quote down for leaving it out.">
            <div className="grid sm:grid-cols-2 gap-4">
              <AskSelect label="What level of finish are you expecting?" value={finish} onChange={setFinish} options={FINISH} />
              <AskSelect label="Is there anything to demolish or remove before work starts?" value={demolition} onChange={setDemolition} options={YES_NO_UNSURE} />
              <AskSelect label="Has a test dig been completed?" value={testDig} onChange={setTestDig} options={YES_NO_UNSURE} />
              {testDig === "Yes" && (
                <AskSelect label="Were foundation depths or ground conditions confirmed?" value={foundationsConfirmed} onChange={setFoundationsConfirmed} options={YES_NO_UNSURE} />
              )}
              <AskSelect label="Is Building Control already arranged?" value={buildingControl} onChange={setBuildingControl} options={BC_STATUS} />
              <AskSelect label="Does the work involve opening up the existing house, removing walls, or a knock-through?" value={opensUp} onChange={setOpensUp} options={YES_NO_UNSURE} />
              {opensUp === "Yes" && (
                <AskSelect label="Do you have structural calculations or an engineer's report?" value={structuralCalcs} onChange={setStructuralCalcs} options={YES_NO_UNSURE} />
              )}
              <AskSelect label="Are electrics expected to be included?" value={electrics} onChange={setElectrics} options={YES_NO_UNSURE} />
              {electrics === "Yes" && (
                <AskSelect label="Do you know how many sockets/lights/switches you expect?" value={electricsQty} onChange={setElectricsQty} options={QUANTITIES} />
              )}
              <AskSelect label="Are plumbing or heating works expected?" value={plumbHeat} onChange={setPlumbHeat} options={PLUMB_HEAT} />
              <AskSelect label="Is plastering expected?" value={plastering} onChange={setPlastering} options={YES_NO_UNSURE} />
              <AskSelect label="Are second-fix joinery items expected? (internal doors, architraves, skirting, window boards)" value={joinery} onChange={setJoinery} options={YES_NO_UNSURE} />
              <AskSelect label="Are decoration, flooring or tiling expected?" value={decoration} onChange={setDecoration} options={DECO} />
              <AskSelect label="Has the builder provided payment stages separately?" value={paymentStages} onChange={setPaymentStages} options={YES_NO_UNSURE} />
              <AskSelect label="Has the builder provided a start date or timescale separately?" value={timescale} onChange={setTimescale} options={YES_NO_UNSURE} />
              <AskSelect label="Are there any verbal agreements not written in the quote?" value={verbalAgreements} onChange={setVerbalAgreements} options={YES_NO_UNSURE} />
            </div>
          </SectionCard>
        )}

        {/* STEP 3 — Email + submit */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label className="font-mono text-sm text-navy">Email Address *</Label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" />
            <p className="font-mono text-xs text-muted-foreground">Your report will open on the next screen.</p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 bg-teal text-white font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20 disabled:bg-muted disabled:text-muted-foreground/70 disabled:opacity-100"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Checking your quote…</span>
            ) : (
              "Check My Quote"
            )}
          </Button>
          <p className="text-center font-mono text-[11px] text-muted-foreground leading-relaxed">
            Guidance only — this does not replace professional advice, surveys, structural design or legal advice.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default SimpleQuoteChecker;
