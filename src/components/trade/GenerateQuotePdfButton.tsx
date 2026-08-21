import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  quoteId: string;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  label?: string;
}

/**
 * Button that calls the `generate-quote-pdf` edge function for a quote and
 * opens the resulting signed URL in a new tab. Only the trade who owns the
 * quote is authorised to generate it.
 */
const GenerateQuotePdfButton = ({
  quoteId,
  variant = "outline",
  size = "sm",
  className,
  label = "Generate PDF",
}: Props) => {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    // Open the tab synchronously inside the click gesture — opening it after
    // the await gets blocked by the browser's popup blocker (the original bug:
    // the button appeared to do nothing).
    const tab = window.open("", "_blank", "noopener,noreferrer");
    try {
      const { data, error } = await supabase.functions.invoke("generate-quote-pdf", {
        body: { quote_id: quoteId },
      });
      if (error) throw error;
      const url = data?.signed_url;
      if (!url) throw new Error("No PDF URL returned");
      if (tab && !tab.closed) {
        tab.location.href = url;
      } else {
        // Popup blocked — fall back to a same-tab download link
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      toast.success("Quote PDF ready");
    } catch (err: any) {
      tab?.close();
      console.error(err);
      toast.error(err?.message || "Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={busy} variant={variant} size={size} className={className}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {busy ? "Generating…" : label}
    </Button>
  );
};

export default GenerateQuotePdfButton;
