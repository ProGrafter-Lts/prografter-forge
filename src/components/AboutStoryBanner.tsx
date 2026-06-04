const AboutStoryBanner = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("why-i-built-it");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href="#why-i-built-it"
      onClick={handleClick}
      className="group block w-full bg-navy hover:bg-navy/90 transition-colors border-y border-teal/20"
      style={{ minHeight: "60px" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-center text-center">
        <span className="font-mono text-sm md:text-[15px] text-cream">
          Why I built this — read my story{" "}
          <span className="text-teal inline-block transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </a>
  );
};

export default AboutStoryBanner;
