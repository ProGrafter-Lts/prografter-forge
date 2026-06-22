import { useState } from "react";
import Logo from "@/components/Logo";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[12px]" style={{ backgroundColor: "rgba(245, 240, 232, 0.92)" }}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Logo className="h-11 w-auto" />

        <div className="hidden craft:flex items-center gap-6">
          <a href="/#how-it-works" className="font-mono text-sm text-body-text hover:text-teal transition-colors">How It Works</a>
          <a href="/#pricing" className="font-mono text-sm text-body-text hover:text-teal transition-colors">Pricing</a>
          <a href="/#features" className="font-mono text-sm text-body-text hover:text-teal transition-colors">Features</a>
          <a href="/quote-checker" className="font-mono text-sm text-body-text hover:text-teal transition-colors">Quote Checker</a>
          <a href="/green" className="font-mono text-sm text-body-text hover:text-teal transition-colors">Green Grants</a>
          <a href="/login" className="font-mono text-sm text-body-text hover:text-teal transition-colors">Login</a>
          <a
            href="/signup/homeowner"
            className="bg-teal text-cream font-mono text-sm px-5 py-2.5 rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20"
          >
            Post a Job
          </a>
          <a
            href="/signup/trade"
            className="border border-teal text-teal font-mono text-sm px-5 py-2 rounded-xl hover:bg-teal hover:text-cream transition-colors"
          >
            Join as a Trade
          </a>
        </div>

        <button
          className="craft:hidden text-navy"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="craft:hidden px-6 pb-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(245, 240, 232, 0.98)" }}>
          <a href="/#how-it-works" className="font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="/#pricing" className="font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="/#features" className="font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/quote-checker" className="font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>Quote Checker</a>
          <a href="/green" className="font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>Green Grants</a>
          <a href="/login" className="font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>Login</a>
          <a href="/signup/homeowner" className="bg-teal text-cream font-mono text-sm px-5 py-2.5 rounded-xl text-center shadow-lg shadow-teal/20" onClick={() => setMenuOpen(false)}>Post a Job</a>
          <a href="/signup/trade" className="border border-teal text-teal font-mono text-sm px-5 py-2 rounded-xl text-center" onClick={() => setMenuOpen(false)}>Join as a Trade</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
