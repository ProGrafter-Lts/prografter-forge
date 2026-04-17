const Footer = () => {
  return (
    <footer className="bg-deep border-t border-cream/5 py-8 px-6">
      <div className="max-w-[1800px] mx-auto flex flex-col gap-6">
        <div className="flex flex-col craft:flex-row items-center justify-between gap-4">
          <a href="#" className="font-heading text-[22px] leading-none">
            <span className="text-cream">Pro</span>
            <span className="text-teal">grafter</span>
          </a>

          <div className="flex gap-6">
            <a href="/about" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">About</a>
            <a href="/privacy" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">Privacy</a>
            <a href="/terms" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">Terms</a>
            <a href="/contact" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">Contact</a>
          </div>

          <p className="font-mono text-xs text-secondary-text">© 2026 ProGrafter. All rights reserved.</p>
        </div>

        {/* UK Companies Act 2006 — required business communication disclosure */}
        <div className="border-t border-cream/5 pt-4">
          <p className="font-mono text-[11px] leading-relaxed text-secondary-text/80 text-center max-w-4xl mx-auto">
            ProGrafter Ltd · Registered in England and Wales · Companies House: [NUMBER] · [REGISTERED ADDRESS] · ICO Registration: [ICO REF] ·{" "}
            <a href="mailto:hello@prografter.co.uk" className="hover:text-teal transition-colors">hello@prografter.co.uk</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
