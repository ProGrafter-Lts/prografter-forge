import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIMARY_LINKS = [
  { label: "Homeowners", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Platform Tour", href: "/platform-tour" },
  { label: "Our Checks", href: "/trade-verification" },
  { label: "Advice", href: "/resources" },
  { label: "About", href: "/about" },
];

const SECONDARY_LINKS = [
  { label: "Trust Centre", href: "/trust", description: "How ProGrafter keeps construction accountable" },
  { label: "Pricing", href: "/pricing", description: "Clear costs for homeowners and trades" },
  { label: "FAQs", href: "/faq", description: "Answers for homeowners and trades" },
  { label: "Contact", href: "/contact", description: "Speak to the ProGrafter team" },
];

const matchesPath = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const PublicHeader = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const secondaryActive = SECONDARY_LINKS.some(({ href }) => matchesPath(pathname, href));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-cream/10 bg-deep/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-5 px-5 craft:px-6">
        <Logo variant="light" className="h-12 w-auto shrink-0" />
        <nav aria-label="Primary navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 craft:flex">
          {PRIMARY_LINKS.map(({ label, href }) => {
            const active = matchesPath(pathname, href);
            return (
              <Link key={href} to={href} aria-current={active ? "page" : undefined} className={cn("relative whitespace-nowrap px-2.5 py-3 font-body text-[13px] font-medium text-cream/75 transition-colors hover:text-cream", active && "text-teal after:absolute after:inset-x-2.5 after:bottom-1 after:h-0.5 after:bg-teal")}>
                {label}
              </Link>
            );
          })}
          <div ref={moreRef} className="relative">
            <button type="button" aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((open) => !open)} className={cn("flex items-center gap-1 px-2.5 py-3 font-body text-[13px] font-medium text-cream/75 transition-colors hover:text-cream", secondaryActive && "text-teal")}>
              More <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen && (
              <div role="menu" className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-md border border-cream/10 bg-deep p-2 shadow-xl">
                {SECONDARY_LINKS.map(({ label, href, description }) => (
                  <Link key={href} to={href} role="menuitem" className="block rounded-sm border-l-2 border-transparent px-3 py-2.5 hover:border-teal hover:bg-cream/[0.05]">
                    <span className="block font-body text-sm font-semibold text-cream">{label}</span>
                    <span className="mt-0.5 block font-body text-xs leading-relaxed text-cream/55">{description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="hidden shrink-0 items-center gap-2 craft:flex">
          <Button asChild variant="outline" size="sm" className="border-cream/25 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/for-trades">For Trades</Link></Button>
          <Button asChild variant="ghost" size="sm" className="text-cream hover:bg-cream/10 hover:text-cream"><Link to="/login">Log In</Link></Button>
          <Button asChild variant="cta" size="sm"><Link to="/signup/homeowner">Sign Up</Link></Button>
        </div>
        <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center text-cream craft:hidden">
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {menuOpen && (
        <nav aria-label="Mobile navigation" className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-cream/10 bg-deep px-5 pb-6 craft:hidden">
          <div className="divide-y divide-cream/10">
            {PRIMARY_LINKS.map(({ label, href }) => {
              const active = matchesPath(pathname, href);
              return <Link key={href} to={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center font-body text-sm font-semibold text-cream/80", active && "text-teal")}>{label}</Link>;
            })}
          </div>
          <p className="mb-1 mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-teal">More from ProGrafter</p>
          <div className="grid grid-cols-2 gap-x-5">
            {SECONDARY_LINKS.map(({ label, href }) => <Link key={href} to={href} className="border-b border-cream/10 py-3 font-body text-sm text-cream/70">{label}</Link>)}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="border-cream/25 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/for-trades">For Trades</Link></Button>
            <Button asChild variant="outline" className="border-cream/25 bg-transparent text-cream hover:border-teal hover:bg-transparent hover:text-teal"><Link to="/login">Log In</Link></Button>
            <Button asChild variant="cta" className="col-span-2"><Link to="/signup/homeowner">Sign Up</Link></Button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;