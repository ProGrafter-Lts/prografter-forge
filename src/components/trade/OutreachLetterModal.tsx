import { useState } from "react";
import { X, Copy, Check, FileText } from "lucide-react";

interface OutreachLetterModalProps {
  open: boolean;
  onClose: () => void;
  tradeName: string;
  companyName: string;
  tradeType: string;
  phone: string;
  address: string;
  onSave: (letter: string) => void;
}

function generateLetter(
  tradeName: string,
  companyName: string,
  tradeType: string,
  phone: string,
  address: string
): string {
  return `Dear Homeowner,

I noticed your recent planning approval for works at ${address} and wanted to make contact before your project gets underway.

My name is ${tradeName} and I am a ${tradeType} based in your area, registered and verified through ProGrafter — the UK's commission-only trades marketplace.

I specialise in exactly the type of work your planning permission covers and would be delighted to provide a free, no-obligation quote. All projects managed through ProGrafter include daily site update photos, digital contract sign-off, and a full Homeowner Manual on completion.

Please feel free to call me on ${phone} or visit my profile at prografter.co.uk to see my previous work and reviews.

Kind regards,
${tradeName}
${companyName}
${phone}
prografter.co.uk`;
}

const OutreachLetterModal = ({
  open,
  onClose,
  tradeName,
  companyName,
  tradeType,
  phone,
  address,
  onSave,
}: OutreachLetterModalProps) => {
  const [letter, setLetter] = useState(() =>
    generateLetter(tradeName, companyName, tradeType, phone, address)
  );
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave(letter);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-secondary" />
            <h3 className="font-heading text-primary text-lg">Outreach Letter</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Letter */}
        <div className="flex-1 overflow-auto p-5">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Edit before saving or copying
          </p>
          <textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={18}
            className="w-full bg-background border border-border rounded-xl p-4 font-mono text-xs text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-5 border-t border-border">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-muted/20 text-foreground font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-muted/30 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-secondary" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-secondary/90 transition-colors"
          >
            <FileText className="w-3 h-3" />
            Save & Mark Actioned
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutreachLetterModal;
