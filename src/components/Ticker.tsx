const features = [
  "NO MONTHLY FEES",
  "FAIR COMMISSION",
  "CAPPED AT £900/JOB",
  "VERIFIED LEADS",
  "INSTANT PAYOUTS",
  "TRADE-FIRST DESIGN",
  "LOCAL MATCHING",
  "HONEST PRICING",
];

const Ticker = () => {
  const items = [...features, ...features];

  return (
    <div className="bg-teal py-3 overflow-hidden">
      <div className="animate-ticker flex whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="font-mono text-xs text-cream uppercase tracking-widest mx-8">
            {item} <span className="mx-4 text-cream/40">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
