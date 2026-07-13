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
import { Upload, FileText, Loader2, Flame } from "lucide-react";

// ---- Option sets ------------------------------------------------------------
const WORK_TYPE = [
  "New boiler",
  "Replacement boiler",
  "Boiler repair",
  "Wider heating works",
];
const YES_NO_UNSURE = ["Yes", "No", "Not sure"];
const BOILER_TYPE = ["Combi", "System", "Regular / heat-only", "Not sure"];

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

const BoilerQuoteChecker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Boiler context answers
  const [workType, setWorkType] = useState("");
  const [occupied, setOccupied] = useState("");
  const [removingOld, setRemovingOld] = useState("");
  const [currentType, setCurrentType] = useState("");
  const [locationChanging, setLocationChanging] = useState("");
  const [radiatorChanges, setRadiatorChanges] = useState("");
  const [disposalExpected, setDisposalExpected] = useState("");
  const [controlsExpected, setControlsExpected] = useState("");
  const [warrantyExpected, setWarrantyExpected] = useState("");
  const [certificationExpected, setCertificationExpected] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportingInputRef = useRef<HTMLInputElement>(null);

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

  const canSubmit = !!file && !!email && !isSubmitting;

  const handleSubmit = async () => {
    if (!file || !email) {
      toast({ title: "A few things needed", description: "Please upload your quote and enter your email.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileName = `boiler-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) throw uploadError;

      const supportingUploaded: { path: string; name: string }[] = [];
      for (const sf of supportingFiles.slice(0, 10)) {
        const spName = `boiler-${Date.now()}-support-${Math.random().toString(36).slice(2, 8)}-${sf.name}`;
        const { error: spErr } = await supabase.storage
          .from("quote-pdfs")
          .upload(spName, sf, { contentType: sf.type || "application/octet-stream" });
        if (spErr) { console.warn("supporting upload failed", sf.name, spErr); continue; }
        supportingUploaded.push({ path: spName, name: sf.name });
      }

      const { data: { user } } = await supabase.auth.getUser();

      const projectType = workType || "Boiler / heating";
      const intake = {
        checker: "boiler",
        project_type: projectType,
        boiler_context: {
          work_type: workType,
          property_occupied: occupied,
          existing_boiler_removed: removingOld,
          current_boiler_type: currentType,
          boiler_location_changing: locationChanging,
          radiator_or_pipework_changes: radiatorChanges,
          disposal_of_old_boiler_expected: disposalExpected,
          thermostat_or_smart_controls_expected: controlsExpected,
          warranty_expected: warrantyExpected,
          gas_safe_building_regs_expected: certificationExpected,
        },
      };

      const { data, error } = await supabase.functions.invoke("analyse-boiler-quote", {
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

      navigate(`/boiler-quote-report/${data.id}?t=${encodeURIComponent(data.lookupToken)}`);
    } catch (err) {
      console.error(err);
      toast({ title: "Something went wrong", description: "We couldn't check your quote. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <SEO
        title="Boiler & Heating Quote Checker | Check a Boiler Quote | ProGrafter"
        description="Upload a boiler or heating quote and ProGrafter checks whether it clearly explains the product, installation scope, certification, warranty, exclusions and questions to ask before accepting."
        path="/boiler-quote-checker"
      />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-10 md:pt-28 md:pb-16 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1">
            <Flame className="h-4 w-4 text-teal" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-teal">Boiler / heating quote checker</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-navy">Is your boiler quote clear enough?</h1>
          <p className="font-mono text-sm text-muted-foreground max-w-lg mx-auto">
            Upload your boiler or heating quote and ProGrafter will check whether it clearly explains the product,
            installation scope, certification, warranty, exclusions and questions to ask before accepting.
          </p>
        </div>

        {/* STEP 1 — Upload */}
        <SectionCard step="Step 1" title="Upload the installer's quote" subtitle="PDF, image or screenshot — max 10MB. Quote in Word? Save it as a PDF first.">
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
            <p className="font-mono text-xs text-muted-foreground">Add a spec sheet, warranty details, payment schedule or installer emails. Used only as supporting context.</p>
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
        </SectionCard>

        {/* STEP 2 — Boiler context questions */}
        <SectionCard step="Step 2" title="A few quick questions about your job"
          subtitle="These help us know what's relevant. If you don't expect something, we won't mark the quote down for leaving it out.">
          <div className="grid sm:grid-cols-2 gap-4">
            <AskSelect label="Is this for a new boiler, replacement, repair, or wider heating works?" value={workType} onChange={setWorkType} options={WORK_TYPE} />
            <AskSelect label="Is the property occupied?" value={occupied} onChange={setOccupied} options={YES_NO_UNSURE} />
            <AskSelect label="Is the existing boiler being removed?" value={removingOld} onChange={setRemovingOld} options={YES_NO_UNSURE} />
            <AskSelect label="Do you know the current boiler type?" value={currentType} onChange={setCurrentType} options={BOILER_TYPE} />
            <AskSelect label="Is the new boiler location changing?" value={locationChanging} onChange={setLocationChanging} options={YES_NO_UNSURE} />
            <AskSelect label="Are radiators or pipework changes included?" value={radiatorChanges} onChange={setRadiatorChanges} options={YES_NO_UNSURE} />
            <AskSelect label="Are you expecting disposal of the old boiler?" value={disposalExpected} onChange={setDisposalExpected} options={YES_NO_UNSURE} />
            <AskSelect label="Are you expecting a thermostat or smart controls?" value={controlsExpected} onChange={setControlsExpected} options={YES_NO_UNSURE} />
            <AskSelect label="Are you expecting a warranty?" value={warrantyExpected} onChange={setWarrantyExpected} options={YES_NO_UNSURE} />
            <AskSelect label="Are you expecting Gas Safe certification / Building Regs notification?" value={certificationExpected} onChange={setCertificationExpected} options={YES_NO_UNSURE} />
          </div>
        </SectionCard>

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
              "Check My Boiler Quote"
            )}
          </Button>
          <p className="text-center font-mono text-[11px] text-muted-foreground leading-relaxed">
            Guidance only — this does not replace professional advice or a Gas Safe engineer's assessment.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default BoilerQuoteChecker;
