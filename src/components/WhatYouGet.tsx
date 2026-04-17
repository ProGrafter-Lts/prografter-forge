const features = [
  {
    num: "01",
    title: "Live Project Timeline",
    desc: "See exactly where your project is every single day. Stage by stage. Photo by photo.",
  },
  {
    num: "02",
    title: "Digital Variation Sign-Off",
    desc: "Every change agreed in writing before work starts. Timestamped. Legally robust.",
  },
  {
    num: "03",
    title: "AI Quote Checker",
    desc: "Upload any quote and our AI reviews it against a 43-point checklist before you commit.",
  },
  {
    num: "04",
    title: "Planning Intelligence",
    desc: "Verified trades receive daily alerts of planning approvals near them. The earliest possible notification of new work.",
  },
  {
    num: "05",
    title: "Homeowner Manual",
    desc: "The document that should exist for every home. Materials, certificates, warranties, maintenance schedule. Generated automatically at completion.",
  },
  {
    num: "06",
    title: "Commission Only",
    desc: "We succeed when you succeed. 7.5% on completion. Capped at £900. Nothing before. Nothing if the job doesn't happen.",
  },
];

const WhatYouGet = () => {
  return (
    <section className="bg-card py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Platform</span>
        </div>
        <h2 className="font-heading text-navy text-[48px] craft:text-[64px] leading-none mb-12">
          Built Different. On Purpose.
        </h2>

        <div className="grid craft:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={f.num}
              className="p-8 border border-border rounded-xl fade-up"
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
