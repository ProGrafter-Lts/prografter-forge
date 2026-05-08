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
    try {
      const { data, error } = await supabase.functions.invoke("generate-quote-pdf", {
        body: { quote_id: quoteId },
      });
      if (error) throw error;
      if (!data?.signed_url) throw new Error("No PDF URL returned");
      window.open(data.signed_url, "_blank", "noopener,noreferrer");
      toast.success("Quote PDF ready");
    } catch (err: any) {
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
