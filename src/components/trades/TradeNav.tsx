import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const LINKS = [
  { label: "Find Work", href: "/for-trades" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About Us", href: "/about" },
  { label: "Help", href: "/faq" },
];

const TradeNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        <Logo variant="light" className="h-14 w-auto" />

        <nav className="hidden craft:flex items-center gap-8">
          {LINKS.map((l, i) => (
            <Link
              key={l.label}
              to={l.href}
              className={`font-body text-sm text-cream/80 hover:text-teal transition-colors pb-1 ${
                i === 0 ? "border-b-2 border-teal text-cream" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden craft:flex items-center gap-3">
          <Link
            to="/"
            className="font-body text-xs uppercase tracking-[0.18em] text-cream/60 hover:text-teal transition-colors"
          >
            For Homeowners
          </Link>
          <Link
            to="/login"
            className="font-body text-sm text-cream border border-cream/25 rounded-xl px-5 py-2.5 hover:border-teal hover:text-teal transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup/trade"
            className="font-body text-sm font-semibold text-cream bg-teal rounded-xl px-5 py-2.5 hover:bg-teal-hover transition-colors shadow-lg shadow-teal/25"
          >
            Join Free
          </Link>
        </div>

        <button
          className="craft:hidden text-cream"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="craft:hidden px-6 pb-6 flex flex-col gap-1 bg-deep/95 backdrop-blur-md border-b border-cream/10">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              onClick={() => setOpen(false)}
              className="py-3 font-body text-sm text-cream/85 border-b border-cream/10"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="py-3 font-body text-xs uppercase tracking-[0.18em] text-cream/60"
          >
            For Homeowners
          </Link>
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-1 py-3 text-center font-body text-sm text-cream border border-cream/25 rounded-xl"
          >
            Log In
          </Link>
          <Link
            to="/signup/trade"
            onClick={() => setOpen(false)}
            className="mt-2 py-3 text-center font-body text-sm font-semibold text-cream bg-teal rounded-xl"
          >
            Join Free
          </Link>
        </div>
      )}
    </header>
  );
};

export default TradeNav;
