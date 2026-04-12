import { useState, useRef, useEffect } from "react";
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
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Upload, FileText, Loader2, ShieldCheck } from "lucide-react";

const PROJECT_TYPES = [
  "Extension",
  "Loft Conversion",
  "Rewire",
  "Bathroom",
  "Kitchen",
  "Other",
];

const QuoteCheckerForm = ({ onSubmitted }: { onSubmitted: (id: string, email: string) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [projectType, setProjectType] = useState("");
  const [email, setEmail] = useState("");
  const [postcode, setPostcode] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      if (selected.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 20MB.", variant: "destructive" });
        return;
      }
      setFile(selected);
    } else {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!file || !projectType || !email) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(fileName, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { data: record, error: insertError } = await supabase
        .from("quote_checks")
        .insert({ email, project_type: projectType, postcode, description, pdf_url: fileName })
        .select()
        .single();
      if (insertError) throw insertError;

      supabase.functions.invoke("analyse-quote", { body: { quoteCheckId: record.id } });
      onSubmitted(record.id, email);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Something went wrong", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-6 shadow-sm">
      <div className="space-y-2">
        <Label className="font-mono text-sm text-navy">Quote PDF *</Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-teal/50 transition-colors"
        >
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-teal" />
              <div className="text-left">
                <p className="font-mono text-sm text-navy font-medium">{file.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)}MB — Click to change
                </p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-mono text-sm text-muted-foreground">Click to upload your quote PDF</p>
              <p className="font-mono text-xs text-muted-foreground mt-1">Max 20MB</p>
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
        <Input type="text" placeholder="e.g. SW1A 1AA" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="font-mono" />
      </div>

      <div className="space-y-2">
        <Label className="font-mono text-sm text-navy">What did you ask to be quoted for?</Label>
        <textarea
          placeholder="e.g. Single storey rear extension, 4m x 3m, with bi-fold doors..."
          value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-mono text-sm text-navy">Email Address *</Label>
        <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="font-mono" />
        <p className="font-mono text-xs text-muted-foreground">Your report will be delivered here.</p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !file || !projectType || !email}
        className="w-full h-12 bg-teal text-white font-mono text-sm rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Uploading...</span>
        ) : (
          "Check My Quote — £49"
        )}
      </Button>
      <p className="text-center font-mono text-xs text-muted-foreground">
        Stripe payment coming soon. Currently free during beta.
      </p>
    </div>
  );
};

const QuoteCheckerResult = ({ quoteCheckId, email }: { quoteCheckId: string; email: string }) => {
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        const { data } = await supabase
          .from("quote_checks")
          .select("status, report_html")
          .eq("id", quoteCheckId)
          .single();
        if (data && !cancelled) {
          setStatus(data.status);
          if (data.status === "complete" && data.report_html) {
            setReportHtml(data.report_html);
            return;
          }
          if (data.status === "error") return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [quoteCheckId]);

  if (status === "error") {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-sm text-destructive">Something went wrong analysing your quote. Please try again.</p>
      </div>
    );
  }

  if (!reportHtml) {
    return (
      <div className="text-center py-16 space-y-4">
        <Loader2 className="mx-auto h-10 w-10 text-teal animate-spin" />
        <h2 className="font-heading text-2xl text-navy">Analysing your quote…</h2>
        <p className="font-mono text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Running our 43-point checklist against your quote. This usually takes around 60 seconds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-heading text-2xl text-navy mb-1">Your Quote Analysis</h2>
        <p className="font-mono text-xs text-muted-foreground">Report also sent to {email}</p>
      </div>
      <div
        className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm prose prose-sm max-w-none font-mono
          [&_h1]:font-heading [&_h1]:text-navy [&_h1]:text-xl
          [&_h2]:font-heading [&_h2]:text-navy [&_h2]:text-lg [&_h2]:mt-6
          [&_h3]:font-heading [&_h3]:text-navy [&_h3]:text-base
          [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_tr]:border-b [&_tr]:border-border"
        dangerouslySetInnerHTML={{ __html: reportHtml }}
      />
    </div>
  );
};

const QuoteChecker = () => {
  const [result, setResult] = useState<{ id: string; email: string } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal font-mono text-xs px-3 py-1.5 rounded-full mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              43-Point Quote Analysis
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-navy mb-3">Quote Checker</h1>
            <p className="text-muted-foreground font-mono text-sm max-w-md mx-auto leading-relaxed">
              Upload your builder's quote and get a professional analysis highlighting missing items, vague costs, and questions to ask — in under 60 seconds.
            </p>
          </div>

          {result ? (
            <QuoteCheckerResult quoteCheckId={result.id} email={result.email} />
          ) : (
            <QuoteCheckerForm onSubmitted={(id, email) => setResult({ id, email })} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QuoteChecker;
