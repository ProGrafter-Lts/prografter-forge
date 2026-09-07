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
        description="Join ProGrafter free. No lead fees and no monthly subscription — get matched to genuine local projects from verified UK homeowners and pay 7.5% commission only when you win."
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
