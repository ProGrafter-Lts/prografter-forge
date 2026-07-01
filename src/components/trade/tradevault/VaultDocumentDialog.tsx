import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { VaultDocTypeConfig, VaultDocument } from "@/lib/tradeVault";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeId: string;
  config: VaultDocTypeConfig;
  existing?: VaultDocument;
  onSaved: () => void;
}

const VaultDocumentDialog = ({ open, onOpenChange, tradeId, config, existing, onSaved }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState(existing?.provider_name ?? "");
  const [policy, setPolicy] = useState(existing?.policy_or_membership_number ?? "");
  const [cover, setCover] = useState(existing?.cover_amount ? String(existing.cover_amount) : "");
  const [issueDate, setIssueDate] = useState(existing?.issue_date ?? "");
  const [expiryDate, setExpiryDate] = useState(existing?.expiry_date ?? "");
  const [notes, setNotes] = useState(existing?.trade_notes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!file && !existing?.file_url) {
      toast({ title: "Please choose a file to upload", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      let fileUrl = existing?.file_url ?? null;
      let filename = existing?.original_filename ?? null;

      if (file) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${user.id}/vault/${config.key}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("trade-verification-documents")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        fileUrl = path;
        filename = file.name;
      }

      // Preserve audit trail: mark any prior current record of this type as not current.
      await supabase
        .from("tradevault_documents")
        .update({ is_current: false })
        .eq("trade_id", tradeId)
        .eq("document_type", config.key)
        .eq("is_current", true);

      const { error: insErr } = await supabase.from("tradevault_documents").insert({
        trade_id: tradeId,
        document_type: config.key,
        file_url: fileUrl,
        original_filename: filename,
        provider_name: config.hasProvider ? provider || null : null,
        policy_or_membership_number: config.hasPolicy ? policy || null : null,
        cover_amount: config.hasCover && cover ? Number(cover) : null,
        issue_date: issueDate || null,
        expiry_date: config.hasExpiry ? expiryDate || null : null,
        trade_notes: notes || null,
        status: "pending_review",
        is_current: true,
      });
      if (insErr) throw insErr;

      toast({ title: "Document saved", description: "It's now pending review by ProGrafter." });
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Could not save document", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Update" : "Upload"} — {config.label}</DialogTitle>
          <DialogDescription>
            Store your document and its renewal date. ProGrafter uses this to verify your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="vault-file">Document file</Label>
            <Input
              id="vault-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1"
            />
            {existing?.original_filename && !file && (
              <p className="text-xs text-muted-foreground mt-1">Current: {existing.original_filename}</p>
            )}
          </div>

          {config.hasProvider && (
            <div>
              <Label htmlFor="vault-provider">Provider / insurer / awarding body</Label>
              <Input id="vault-provider" value={provider} onChange={(e) => setProvider(e.target.value)} className="mt-1" />
            </div>
          )}

          {config.hasPolicy && (
            <div>
              <Label htmlFor="vault-policy">Policy / membership number</Label>
              <Input id="vault-policy" value={policy} onChange={(e) => setPolicy(e.target.value)} className="mt-1" />
            </div>
          )}

          {config.hasCover && (
            <div>
              <Label htmlFor="vault-cover">Cover amount (£)</Label>
              <Input id="vault-cover" type="number" value={cover} onChange={(e) => setCover(e.target.value)} className="mt-1" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vault-issue">Issue date</Label>
              <Input id="vault-issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="mt-1" />
            </div>
            {config.hasExpiry && (
              <div>
                <Label htmlFor="vault-expiry">Expiry date</Label>
                <Input id="vault-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-1" />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="vault-notes">Notes (optional)</Label>
            <Textarea id="vault-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Save document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VaultDocumentDialog;
