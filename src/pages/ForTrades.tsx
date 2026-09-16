import SEO from "@/components/SEO";
import TradeNav from "@/components/trades/TradeNav";
import TradeHero from "@/components/trades/TradeHero";
import TradeWaysPanel from "@/components/trades/TradeWaysPanel";
import TradeStepsSection from "@/components/trades/TradeStepsSection";
import TradeCommissionBand from "@/components/trades/TradeCommissionBand";
import TradeCtaBand from "@/components/trades/TradeCtaBand";
import Footer from "@/components/Footer";
import { COMMISSION_CAP_SENTENCE, COMMISSION_RATE_LABEL } from "@/lib/pricingTerms";

const ForTrades = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="ProGrafter For Trades — More Right Jobs, Less Time Wasted"
        description={`Get matched to suitable local projects without paying for leads. Join free; pay ${COMMISSION_RATE_LABEL} only on completed paid jobs, ${COMMISSION_CAP_SENTENCE}.`}
        path="/for-trades"
      />
      <TradeNav />
      <main>
        <TradeHero />
        <TradeWaysPanel />
        <TradeStepsSection />
        <TradeCommissionBand />
        <TradeCtaBand />
      </main>
      <Footer />
    </div>
  );
};

export default ForTrades;
