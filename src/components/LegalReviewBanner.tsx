import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "pg_legal_review_banner_dismissed";

// Contract templates are with our construction solicitor for final legal
// review. We deliberately don't commit to a public date here — when signing
// goes live we'll update the in-app banner and notify trades directly.
export const LEGAL_REVIEW_ETA = "within the next few weeks — we'll notify you by email the moment signing goes live";

const LegalReviewBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 mb-4 flex items-start gap-3"
      style={{
        backgroundColor: "rgba(251, 191, 36, 0.10)",
        border: "1px solid rgba(251, 191, 36, 0.35)",
      }}
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#FCD34D" }} />
      <p className="font-mono text-xs flex-1" style={{ color: "#FDE68A" }}>
        Contract templates: under final legal review with our construction solicitor.
        Full signing functionality coming soon — we'll notify you when it's live.{" "}
        <Link to="/legal-review" className="underline font-medium hover:opacity-80" style={{ color: "#FEF3C7" }}>
          Read more →
        </Link>
      </p>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        aria-label="Dismiss notice"
        className="hover:opacity-80 transition-opacity shrink-0"
        style={{ color: "#FCD34D" }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LegalReviewBanner;
