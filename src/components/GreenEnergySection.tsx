const schemes = [
  {
    title: "ECO4",
    description: "Fully funded for eligible households · Up to £18,000",
    bg: "bg-[#16A34A]",
  },
  {
    title: "Boiler Upgrade Scheme",
    description: "£7,500 towards a heat pump",
    bg: "bg-teal",
  },
  {
    title: "Great British Insulation Scheme",
    description: "Up to £10,000 for insulation",
    bg: "bg-navy",
  },
  {
    title: "0% VAT",
    description: "Zero VAT on all energy saving installations",
    bg: "bg-deep",
  },
];

const GreenEnergySection = () => {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="w-full max-w-[1800px] mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#16A34A] font-mono text-sm tracking-widest uppercase mb-3 block">
            🌿 Green Energy
          </span>
          <h2 className="font-heading text-4xl md:text-5xl text-navy tracking-wide mb-4">
            COULD YOU GET HELP FUNDING YOUR HOME IMPROVEMENTS?
          </h2>
          <p className="font-body text-body-text max-w-2xl mx-auto text-base leading-relaxed">
            The UK government is funding thousands of pounds of energy improvements for eligible homeowners. ProGrafter connects you with certified local installers for solar panels, heat pumps, insulation, and EV chargers — and helps you understand what funding you may qualify for.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {schemes.map((s) => (
            <div
              key={s.title}
              className={`${s.bg} rounded-xl p-6 text-white`}
            >
              <h3 className="font-heading text-2xl tracking-wide mb-1">{s.title}</h3>
              <p className="font-mono text-sm opacity-90">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="/green"
            className="inline-block bg-[#16A34A] text-white font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-[#15803D] transition-colors shadow-lg shadow-[#16A34A]/20"
          >
            Find Out What You Could Qualify For — Free →
          </a>
        </div>
      </div>
    </section>
  );
};

export default GreenEnergySection;
