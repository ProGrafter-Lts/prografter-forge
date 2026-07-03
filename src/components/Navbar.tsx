import { useState } from "react";
import Logo from "@/components/Logo";

type NavItem = { label: string; href: string; desc?: string };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Homeowners",
    items: [
      { label: "Post a Job", href: "/post-job-brief", desc: "Get matched with vetted trades" },
      { label: "How It Works", href: "/how-it-works", desc: "Your project, step by step" },
      { label: "Homeowner Verification", href: "/homeowner-verification", desc: "Why we verify everyone" },
      { label: "Green Grants", href: "/green", desc: "Funding for energy upgrades" },
    ],
  },
  {
    label: "Trades",
    items: [
      { label: "Join as a Trade", href: "/signup/trade", desc: "Free — commission only" },
      { label: "Trade Verification", href: "/trade-verification", desc: "Our 5-step check" },
      { label: "Planning Alerts", href: "/planning-alerts", desc: "Turn planning into work" },
      { label: "Pricing", href: "/pricing", desc: "Commission only, no monthly fees" },
      { label: "Calculators", href: "/calculators", desc: "Commission & savings tools" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "AI Quote Checker", href: "/ai-quote-checker", desc: "Instant Quote Clarity Score" },
      { label: "Quote Clarity Score", href: "/quote-clarity-score", desc: "How we score quotes" },
      { label: "ProGrafter Intelligence", href: "/prografter-intelligence", desc: "The full toolkit" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Advice Centre", href: "/resources", desc: "Guides & tools" },
      { label: "FAQ", href: "/faq", desc: "Common questions answered" },
      { label: "Is Checkatrade Worth It?", href: "/is-checkatrade-worth-it" },
      { label: "Checkatrade Alternative", href: "/checkatrade-alternative" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const SINGLES: NavItem[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[12px] border-b border-border/40" style={{ backgroundColor: "rgba(245, 240, 232, 0.92)" }}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Logo className="h-11 w-auto" />

        {/* Desktop */}
        <div className="hidden craft:flex items-center gap-1">
          {GROUPS.map((g) => (
            <div
              key={g.label}
              className="relative"
              onMouseEnter={() => setOpenGroup(g.label)}
              onMouseLeave={() => setOpenGroup((cur) => (cur === g.label ? null : cur))}
            >
              <button className="font-mono text-sm text-body-text hover:text-teal transition-colors px-3 py-2 flex items-center gap-1">
                {g.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M6 9l6 6 6-6" /></svg>
              </button>
              {openGroup === g.label && (
                <div className="absolute left-0 top-full pt-2 w-64 animate-fade-in">
                  <div className="rounded-2xl border border-border/60 bg-cream shadow-xl p-2">
                    {g.items.map((it) => (
                      <a
                        key={it.label}
                        href={it.href}
                        className="block rounded-xl px-3 py-2.5 hover:bg-teal/10 transition-colors"
                      >
                        <div className="font-mono text-sm text-navy">{it.label}</div>
                        {it.desc && <div className="font-body text-xs text-secondary-text mt-0.5">{it.desc}</div>}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {SINGLES.map((s) => (
            <a key={s.label} href={s.href} className="font-mono text-sm text-body-text hover:text-teal transition-colors px-3 py-2">
              {s.label}
            </a>
          ))}

          <a href="/login" className="font-mono text-sm text-body-text hover:text-teal transition-colors px-3 py-2">Login</a>
          <a
            href="/quote-checker"
            className="ml-1 bg-teal text-cream font-mono text-sm px-5 py-2.5 rounded-xl hover:bg-teal-hover transition-colors shadow-lg shadow-teal/20 flex items-center gap-1.5"
          >
            <span className="leading-none">✦</span> Upload Quote
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="craft:hidden text-navy"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {menuOpen ? <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="craft:hidden px-6 pb-5 flex flex-col gap-1 max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "rgba(245, 240, 232, 0.98)" }}>
          {GROUPS.map((g) => (
            <div key={g.label} className="border-b border-border/40">
              <button
                className="w-full flex items-center justify-between py-3 font-mono text-sm text-navy"
                onClick={() => setMobileGroup((cur) => (cur === g.label ? null : g.label))}
              >
                {g.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${mobileGroup === g.label ? "rotate-180" : ""}`}><path strokeLinecap="round" d="M6 9l6 6 6-6" /></svg>
              </button>
              {mobileGroup === g.label && (
                <div className="pb-2 pl-3 flex flex-col gap-1">
                  {g.items.map((it) => (
                    <a key={it.label} href={it.href} className="py-2 font-mono text-sm text-body-text" onClick={() => setMenuOpen(false)}>
                      {it.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {SINGLES.map((s) => (
            <a key={s.label} href={s.href} className="py-3 font-mono text-sm text-navy border-b border-border/40" onClick={() => setMenuOpen(false)}>
              {s.label}
            </a>
          ))}
          <a href="/login" className="py-3 font-mono text-sm text-navy" onClick={() => setMenuOpen(false)}>Login</a>
          <a href="/quote-checker" className="mt-2 bg-teal text-cream font-mono text-sm px-5 py-3 rounded-xl text-center shadow-lg shadow-teal/20" onClick={() => setMenuOpen(false)}>✦ Upload Quote</a>
          <a href="/signup/trade" className="mt-1 border border-teal text-teal font-mono text-sm px-5 py-3 rounded-xl text-center" onClick={() => setMenuOpen(false)}>Join as a Trade</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
