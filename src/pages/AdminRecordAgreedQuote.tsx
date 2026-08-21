import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, FileCheck2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface JobRow {
  id: string;
  ref: string | null;
  title: string | null;
  job_type: string | null;
  address: string | null;
  postcode: string | null;
  status: string;
}

interface TradeRow { id: string; company_name: string | null; name: string | null }

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const AdminRecordAgreedQuote = () => {
  const [search, setSearch] = useState("PG-GEMANN");
  const [searching, setSearching] = useState(false);
  const [job, setJob] = useState<JobRow | null>(null);
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [tradeId, setTradeId] = useState("");
  const [amount, setAmount] = useState("");
  const [agreedAt, setAgreedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("trades")
        .select("id, company_name, name")
        .order("company_name");
      setTrades((data ?? []) as TradeRow[]);
    })();
  }, []);

  const findJob = async () => {
    const term = search.trim();
    if (!term) return;
    setSearching(true);
    setResult(null);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, ref, title, job_type, address, postcode, status")
      .or(`ref.ilike.%${term}%,title.ilike.%${term}%,address.ilike.%${term}%`)
      .limit(1)
      .maybeSingle();
    setSearching(false);
    if (error || !data) {
      setJob(null);
      toast({ title: "No matching job found", variant: "destructive" });
      return;
    }
    setJob(data as JobRow);
  };

  const submit = async () => {
    if (!job) return;
    if (!tradeId) { toast({ title: "Choose the trade", variant: "destructive" }); return; }
    if (!amount || Number(amount) <= 0) { toast({ title: "Enter the agreed value", variant: "destructive" }); return; }
    if (!quoteFile) { toast({ title: "Upload the agreed quote document", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        jobId: job.id,
        tradeId,
        amount: Number(amount),
        agreedAt: agreedAt || null,
        notes: notes || null,
        notifyHomeowner: notify,
        quoteFile: { name: quoteFile.name, data: await fileToBase64(quoteFile) },
      };
      if (contractFile) {
        payload.contractFile = { name: contractFile.name, data: await fileToBase64(contractFile) };
      }

      const { data, error } = await supabase.functions.invoke("record-agreed-quote", { body: payload });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      setResult(data as Record<string, unknown>);
      toast({ title: "Agreed quote recorded", description: "The job is now marked in progress. No new-quote email was sent." });
      setJob({ ...job, status: "in_progress" });
    } catch (e) {
      toast({ title: "Could not record", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Record an already-agreed quote</h1>
        <p className="text-sm text-muted-foreground mt-1">
          For jobs where the quote and contract were agreed directly with the homeowner. This files
          the documents against the job and marks it in progress — it does <strong>not</strong> send
          the standard new-quote notification.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Label htmlFor="job-search">Find the job (reference, title or address)</Label>
        <div className="flex gap-2">
          <Input id="job-search" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findJob()} placeholder="PG-GEMANN" />
          <Button onClick={findJob} disabled={searching} variant="outline">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {job && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium text-foreground">{job.ref} — {job.title || job.job_type}</p>
            <p className="text-muted-foreground">{[job.address, job.postcode].filter(Boolean).join(", ")}</p>
            <p className="text-muted-foreground">Current status: {job.status}</p>
          </div>
        )}
      </div>

      {job && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <Label>Trade</Label>
            <Select value={tradeId} onValueChange={setTradeId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select the trade" /></SelectTrigger>
              <SelectContent>
                {trades.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.company_name || t.name || t.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="agreed-amount">Agreed value (£)</Label>
              <Input id="agreed-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="agreed-date">Date agreed</Label>
              <Input id="agreed-date" type="date" value={agreedAt} onChange={(e) => setAgreedAt(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="quote-doc">Agreed quote document (required)</Label>
            <Input id="quote-doc" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1"
              onChange={(e) => setQuoteFile(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <Label htmlFor="contract-doc">Signed contract document (optional)</Label>
            <Input id="contract-doc" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="mt-1"
              onChange={(e) => setContractFile(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <Label htmlFor="agreed-notes">Notes for the record (optional)</Label>
            <Textarea id="agreed-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} className="mt-0.5" />
            <span className="text-muted-foreground">
              Send the homeowner a courtesy "your agreed quote and contract are now on file" email.
              This is a distinct message — the new-quote notification is never sent from here.
            </span>
          </label>

          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck2 className="w-4 h-4 mr-2" />}
            Record agreed quote &amp; contract
          </Button>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Recorded.</p>
          <p>Quote reference: {String((result as any).reference ?? (result as any).quoteId)}</p>
          <p>Job status: in progress</p>
          <p>Courtesy email sent: {(result as any).emailed ? "yes" : "no"}</p>
          <p>New-quote notification sent: no</p>
        </div>
      )}
    </div>
  );
};

export default AdminRecordAgreedQuote;
