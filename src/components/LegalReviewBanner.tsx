import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "pg_legal_review_banner_dismissed";

// Date the construction solicitor is expected to deliver the final template.
// Update this when scheduling firms up. Shown to logged-in users in the banner
// and on the /legal-review page.
export const LEGAL_REVIEW_ETA = "early June 2026";

const LegalReviewBanner = () => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
      <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
      <p className="font-mono text-xs text-amber-900 flex-1">
        Contract templates: under final legal review with our construction solicitor.
        Full signing functionality activates {LEGAL_REVIEW_ETA}.{" "}
        <Link to="/legal-review" className="underline font-medium hover:text-amber-700">
          Read more →
        </Link>
      </p>
      <button
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        aria-label="Dismiss notice"
        className="text-amber-700 hover:text-amber-900 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LegalReviewBanner;
