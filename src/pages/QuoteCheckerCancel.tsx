import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle } from "lucide-react";

const QuoteCheckerCancel = () => {
  const navigate = useNavigate();
  return (
    <AppShell>
      <SEO title="Payment cancelled | ProGrafter" description="Your Quote Checker payment was cancelled — no charge was taken." path="/quote-checker/cancel" />
      <div className="max-w-lg mx-auto px-4 pt-28 pb-16 text-center space-y-5">
        <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="font-heading text-2xl text-navy">Payment cancelled</h1>
        <p className="font-mono text-sm text-muted-foreground">
          No charge was taken. Your quote wasn't reviewed. You can go back and try again whenever you're ready.
        </p>
        <Button onClick={() => navigate("/quote-checker")} className="bg-teal text-white hover:bg-teal-hover font-mono text-sm mx-auto">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Quote Checker
        </Button>
      </div>
    </AppShell>
  );
};

export default QuoteCheckerCancel;
