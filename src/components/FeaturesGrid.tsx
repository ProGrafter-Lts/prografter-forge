const features = [
  { num: "01", title: "Local Lead Matching", desc: "Get connected with homeowners in your area who need your specific skills." },
  { num: "02", title: "Instant Notifications", desc: "Be the first to respond to new jobs with real-time alerts on your phone." },
  { num: "03", title: "Review & Reputation", desc: "Build your online reputation with verified reviews from completed jobs." },
  { num: "04", title: "Simple Dashboard", desc: "Track leads, jobs, and earnings in one clean, no-nonsense interface." },
  { num: "05", title: "Fair Pricing Model", desc: "7.5% commission on completed work only. No monthly fees. Capped at £900." },
  { num: "06", title: "Direct Communication", desc: "Chat directly with homeowners. No middleman, no phone tag." },
];

const FeaturesGrid = () => {
  return (
    <section id="features" className="bg-card py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Features</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-12">What You Get</h2>

        <div className="grid craft:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={f.num}
              className="p-8 border border-border rounded-[4px] fade-up"
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <span className="font-mono text-xs text-teal tracking-widest mb-3 block">{f.num}</span>
              <h3 className="font-body text-navy text-lg font-bold mb-2">{f.title}</h3>
              <p className="font-body text-secondary-text text-sm font-light leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
