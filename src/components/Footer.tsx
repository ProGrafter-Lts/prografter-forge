import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { openCookiePreferences } from "@/components/CookieConsent";

const FOOTER_GROUPS = [
  { title: "Homeowners", links: [["Project Cost Guide", "/project-cost-guide"], ["Quote Checker", "/quote-checker"], ["How It Works", "/how-it-works"], ["Our Checks", "/trade-verification"]] },
  { title: "ProGrafter", links: [["Platform Tour", "/platform-tour"], ["Trust Centre", "/trust"], ["Advice", "/resources"], ["About", "/about"]] },
  { title: "For Trades", links: [["Join as a Trade", "/signup/trade"], ["Pricing", "/pricing"], ["Planning Alerts", "/planning-intelligence"], ["Calculators", "/calculators"]] },
];

const Footer = () => {
  return (
    <footer data-site-footer className="border-t border-cream/10 bg-deep px-6 py-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 border-b border-cream/10 pb-10 craft:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo variant="light" className="h-14 w-auto" />
            <p className="mt-5 max-w-xs font-heading text-2xl uppercase leading-tight text-cream">Built for proper grafters.</p>
            <p className="mt-3 max-w-sm font-body text-sm leading-relaxed text-cream/60">Clearer quotes, verified people and one shared place to manage building work.</p>
            <Link to="/prografter-intelligence" className="mt-5 inline-flex border-b border-teal pb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-teal">ProGrafter Intelligence</Link>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-teal">{group.title}</p>
                <div className="flex flex-col gap-3">
                  {group.links.map(([label, href]) => <Link key={href} to={href} className="font-body text-sm text-cream/65 transition-colors hover:text-cream">{label}</Link>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5 py-6 craft:flex-row craft:items-center craft:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            <Link to="/privacy" className="font-mono text-[11px] text-cream/55 hover:text-teal">Privacy</Link>
            <Link to="/terms" className="font-mono text-[11px] text-cream/55 hover:text-teal">Terms</Link>
            <Link to="/cookies" className="font-mono text-[11px] text-cream/55 hover:text-teal">Cookies</Link>
            <Link to="/complaints" className="font-mono text-[11px] text-cream/55 hover:text-teal">Complaints</Link>
            <Link to="/contact" className="font-mono text-[11px] text-cream/55 hover:text-teal">Contact</Link>
            <Link to="/suppliers" className="font-mono text-[11px] text-cream/55 hover:text-teal">Suppliers</Link>
            <button type="button" onClick={openCookiePreferences} className="font-mono text-[11px] text-cream/55 hover:text-teal">Consent Preferences</button>
          </div>
          <p className="font-mono text-[11px] text-cream/45">© 2026 ProGrafter. All rights reserved.</p>
        </div>
        <div className="border-t border-cream/10 pt-5">
          <p className="mx-auto max-w-4xl text-center font-mono text-[10px] leading-relaxed text-cream/45">
            ProGrafter Ltd · Registered in England and Wales · Company number 17124130 · ICO Registration ZC114018 ·{" "}
            <a href="mailto:hello@prografter.co.uk" className="hover:text-teal transition-colors">hello@prografter.co.uk</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
