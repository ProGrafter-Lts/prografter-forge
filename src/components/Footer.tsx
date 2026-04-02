const Footer = () => {
  return (
    <footer className="bg-deep border-t border-cream/5 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col craft:flex-row items-center justify-between gap-4">
        <a href="#" className="font-heading text-[22px] leading-none">
          <span className="text-cream">Pro</span>
          <span className="text-teal">grafter</span>
        </a>

        <div className="flex gap-6">
          <a href="/privacy" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">Privacy</a>
          <a href="#" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">Terms</a>
          <a href="#" className="font-mono text-xs text-secondary-text hover:text-teal transition-colors">Contact</a>
        </div>

        <p className="font-mono text-xs text-secondary-text">© 2026 ProGrafter. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
