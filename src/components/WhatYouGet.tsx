const features = [
  {
    num: "01",
    title: "Live Project Timeline",
    desc: "Follow every stage of your project with a real-time timeline and daily photo updates from your tradesperson.",
  },
  {
    num: "02",
    title: "Digital Variation Sign-Off",
    desc: "Any changes to the original scope are documented and require your digital approval before work proceeds.",
  },
  {
    num: "03",
    title: "AI Quote Checker",
    desc: "Our AI analyses quotes against local market data so you know if you're getting a fair price — instantly.",
  },
  {
    num: "04",
    title: "Planning Intelligence Alerts",
    desc: "Get notified about planning applications, building regulations, and compliance requirements that affect your project.",
  },
  {
    num: "05",
    title: "Homeowner Manual",
    desc: "At completion, receive a comprehensive digital manual — warranties, certificates, photos, and maintenance schedules for your property.",
  },
  {
    num: "06",
    title: "Verified & Insured Trades",
    desc: "Every tradesperson on ProGrafter is verified, insured, and reviewed. No cowboys, no chancers.",
  },
];

const WhatYouGet = () => {
  return (
    <section className="bg-cream py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Platform</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-12">What You Get</h2>

        <div className="grid craft:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={f.num}
              className="p-8 border border-border rounded-xl bg-card fade-up"
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

export default WhatYouGet;
