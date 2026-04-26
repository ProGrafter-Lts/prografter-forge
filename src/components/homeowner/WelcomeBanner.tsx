import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "pg_homeowner_welcome_dismissed";

interface WelcomeBannerProps {
  hasProjects: boolean;
}

const WelcomeBanner = ({ hasProjects }: WelcomeBannerProps) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (hasProjects || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-teal/10 to-teal/5 border border-teal/30 rounded-2xl p-5 craft:p-6 mb-6 relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss welcome message"
        className="absolute top-3 right-3 text-secondary-text hover:text-navy transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
      <div className="flex flex-col craft:flex-row craft:items-center gap-4 craft:gap-6 pr-6">
        <div className="flex-1">
          <h2 className="font-heading text-navy text-xl craft:text-2xl mb-1">
            Welcome to ProGrafter!
          </h2>
          <p className="font-body text-sm text-body-text">
            Post your first job to get matched with verified tradespeople in your area.
          </p>
        </div>
        <Link
          to="/post-a-job"
          className="inline-block bg-teal text-cream font-mono text-sm px-6 py-2.5 rounded-xl hover:bg-teal-hover transition-colors whitespace-nowrap text-center"
        >
          Post a Job →
        </Link>
      </div>
    </div>
  );
};

export default WelcomeBanner;
