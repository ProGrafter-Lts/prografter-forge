import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthReady } from "@/hooks/useAuthReady";
import { supabase } from "@/integrations/supabase/client";

const PRIMARY_LINKS = [
  { label: "Homeowners", href: "/" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Platform Tour", href: "/platform-tour#live-now" },
  { label: "Our Checks", href: "/trade-verification#our-checks" },
  { label: "Advice", href: "/resources" },
  { label: "About", href: "/about" },
];

const SECONDARY_LINKS = [
  { label: "Trust Centre", href: "/trust", description: "How ProGrafter keeps construction accountable" },
  { label: "Pricing", href: "/pricing#marketplace-pricing", description: "Clear costs for homeowners and trades" },
  { label: "FAQs", href: "/faq", description: "Answers for homeowners and trades" },
  { label: "Contact", href: "/contact", description: "Speak to the ProGrafter team" },
];

const matchesPath = (pathname: string, href: string) => {
  const path = href.split(/[?#]/)[0] || "/";
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
};

const PublicHeader = () => {
  const { pathname, hash } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkHero, setDarkHero] = useState(true);
  const [dashboardHref, setDashboardHref] = useState("/dashboard/homeowner");
  const { user } = useAuthReady();
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void supabase.from("trades").select("id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!cancelled) setDashboardHref(data ? "/dashboard/trade" : "/dashboard/homeowner");
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const secondaryActive = SECONDARY_LINKS.some(({ href }) => matchesPath(pathname, href));
  const tradesActive = matchesPath(pathname, "/for-trades");
  const isHomeownerLanding = pathname === "/";

  // Merge into the hero at the top, then compact the fixed mobile bar after a meaningful scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only merge into the hero when that hero is dark; light heroes keep a solid bar.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const hero = document.querySelector("main section, section");
      if (!hero) return setDarkHero(true);
      const match = getComputedStyle(hero).backgroundColor.match(/\d+(\.\d+)?/g);
      if (!match || Number(match[3] ?? 1) === 0) return setDarkHero(true);
      const [r, g, b] = match.map(Number);
      setDarkHero(0.299 * r + 0.587 * g + 0.114 * b < 140);
    }, 60);
    return () => window.clearTimeout(id);
  }, [pathname]);

  const solid = scrolled || menuOpen || !darkHero;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none",
        solid
          ? "border-b border-cream/10 bg-deep/95 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.9)] backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-deep/90 via-deep/40 to-transparent",
      )}
    >
      <div className={cn("mx-auto flex max-w-[1400px] items-center justify-between gap-5 px-5 transition-[height] duration-300 motion-reduce:transition-none craft:h-[72px] craft:px-6", scrolled && !menuOpen ? "h-14" : "h-[72px]")}>
        <Logo variant="light" className={cn("w-auto shrink-0 transition-[height] duration-300 motion-reduce:transition-none craft:h-12", scrolled && !menuOpen ? "h-9" : "h-12")} />
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
          <Button asChild variant="marketingOutline" size="sm" className={cn(tradesActive && "border-teal text-teal")}><Link to="/for-trades" aria-current={tradesActive ? "page" : undefined}>For Trades</Link></Button>
          {user ? (
            <Button asChild variant="cta" size="sm"><Link to={dashboardHref}>Return to Dashboard</Link></Button>
          ) : (
            <>
            <Button asChild variant="ghost" size="sm" className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-cream hover:bg-cream/10 hover:text-cream"><Link to="/login">Log In</Link></Button>
              <Button asChild variant="cta" size="sm"><Link to={isHomeownerLanding ? "/post-job-brief" : "/signup/homeowner"}>{isHomeownerLanding ? "Post a Job" : "Sign Up"}</Link></Button>
            </>
          )}
        </div>
        <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center text-cream craft:hidden">
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {menuOpen && (
        <nav aria-label="Mobile navigation" className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-cream/10 bg-deep px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] craft:hidden">
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
            <Button asChild variant="marketingOutline"><Link to="/for-trades">For Trades</Link></Button>
            {user ? (
              <Button asChild variant="cta"><Link to={dashboardHref}>Dashboard</Link></Button>
            ) : (
              <>
                <Button asChild variant="marketingOutline"><Link to="/login">Log In</Link></Button>
                <Button asChild variant="cta" className="col-span-2"><Link to={isHomeownerLanding ? "/post-job-brief" : "/signup/homeowner"}>{isHomeownerLanding ? "Post a Job" : "Sign Up"}</Link></Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default PublicHeader;