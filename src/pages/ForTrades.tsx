import SEO from "@/components/SEO";
import TradeNav from "@/components/trades/TradeNav";
import TradeHero from "@/components/trades/TradeHero";
import TradeWaysPanel from "@/components/trades/TradeWaysPanel";
import TradeStepsSection from "@/components/trades/TradeStepsSection";
import TradeCommissionBand from "@/components/trades/TradeCommissionBand";
import TradeCtaBand from "@/components/trades/TradeCtaBand";
import Footer from "@/components/Footer";

const ForTrades = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="ProGrafter For Trades — More Right Jobs, Less Time Wasted"
        description="No subscription to join, quote, or get paid—ever. Get matched to genuine local projects free; optional paid tools are separate add-ons."
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
