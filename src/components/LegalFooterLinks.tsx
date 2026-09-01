import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { openCookiePreferences } from "@/components/CookieConsent";

export const LEGAL_LINKS: { label: string; to: string }[] = [
  { label: "Terms of Use", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Cookie Policy", to: "/cookies" },
  { label: "Complaints Policy", to: "/complaints" },
];

/** Inline list of the four required legal links. Styled to match the site footer. */
export const LegalFooterLinks = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-3 ${className}`}>
    {LEGAL_LINKS.map((l) => (
      <Link
        key={l.to}
        to={l.to}
        className="font-mono text-xs text-secondary-text hover:text-teal transition-colors"
      >
        {l.label}
      </Link>
    ))}
  </div>
);

/**
 * Compact legal bar rendered app-wide. It hides itself on pages that already
 * render the full marketing footer (which carries the same links), so
 * dashboard/app routes still expose Terms, Privacy, Cookies and Complaints.
 */
const GlobalLegalFooter = () => {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      setShow(!document.querySelector("footer[data-site-footer]"));
    };
    const t1 = window.setTimeout(check, 60);
    const t2 = window.setTimeout(check, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [location.pathname]);

  // Admin workspace pages are full-height working surfaces — the tall legal
  // footer eats the fixed viewport there, so it is not rendered on /admin.
  if (location.pathname.startsWith("/admin")) return null;
  if (!show) return null;


  return (
    <footer className="border-t border-cream/10 bg-deep px-6 py-5">
      <div className="mx-auto flex max-w-[1800px] flex-col items-center gap-3">
        <LegalFooterLinks />
        <button
          type="button"
          onClick={openCookiePreferences}
          className="font-mono text-xs text-secondary-text hover:text-teal transition-colors"
        >
          Consent Preferences
        </button>
        <p className="font-mono text-[11px] text-secondary-text/80 text-center">
          © 2026 ProGrafter Ltd · Company number 17124130
        </p>
      </div>
    </footer>
  );
};

export default GlobalLegalFooter;
