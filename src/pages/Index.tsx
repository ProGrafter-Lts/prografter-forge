import { useEffect } from "react";
import SEO from "@/components/SEO";
import { localBusinessJsonLd, homepageFaqJsonLd } from "@/lib/seoSchemas";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhyProGrafter from "@/components/WhyProGrafter";
import TrustStats from "@/components/TrustStats";
import WhyWeBuilt from "@/components/WhyWeBuilt";
import FutureRoadmap from "@/components/FutureRoadmap";
import WhereAreYouSection from "@/components/WhereAreYouSection";
import AboutStoryBanner from "@/components/AboutStoryBanner";
import Ticker from "@/components/Ticker";
import HowItWorks from "@/components/HowItWorks";
import OldWayContrast from "@/components/OldWayContrast";
import GreenEnergySection from "@/components/GreenEnergySection";
import ContrastSection from "@/components/ContrastSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import TradesHowItWorks from "@/components/TradesHowItWorks";
import HomeownersHowItWorks from "@/components/HomeownersHowItWorks";
import GreenGrantsChecker from "@/components/GreenGrantsChecker";
import WhatYouGet from "@/components/WhatYouGet";
import WhyDifferent from "@/components/WhyDifferent";
import PlatformPreview from "@/components/PlatformPreview";
import FounderNote from "@/components/FounderNote";
import VerificationStandards from "@/components/VerificationStandards";
import Testimonials from "@/components/Testimonials";
import SeeHowItWorks from "@/components/SeeHowItWorks";
import SignUpSection from "@/components/SignUpSection";
import TradeVerificationExplainer from "@/components/TradeVerificationExplainer";
import AiQuoteCheckerDemo from "@/components/demos/AiQuoteCheckerDemo";
import QuoteComparisonDemo from "@/components/demos/QuoteComparisonDemo";
import VerificationExplainerInteractive from "@/components/demos/VerificationExplainerInteractive";
import Footer from "@/components/Footer";

const Index = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen">
      <SEO
        title="ProGrafter — The UK's AI-Powered Construction Trust Platform"
        description="ProGrafter restores trust to UK construction: AI quote checking, 5-step verified trades, transparent commission-only pricing and smarter project management. Not another directory."
        path="/"
        jsonLd={[localBusinessJsonLd, homepageFaqJsonLd]}
      />
      <Navbar />
      <Hero />
      <WhyProGrafter />
      <TrustStats />
      <AiQuoteCheckerDemo />
      <QuoteComparisonDemo />
      <VerificationExplainerInteractive />
      <WhyWeBuilt />
      <WhereAreYouSection />
      <GreenGrantsChecker />
      <AboutStoryBanner />
      <Ticker />
      <HowItWorks />
      <OldWayContrast />
      <ContrastSection />
      <FeaturesGrid />
      <TradesHowItWorks />
      <HomeownersHowItWorks />
      <GreenEnergySection />
      <WhatYouGet />
      <WhyDifferent />
      <PlatformPreview />
      <FounderNote />
      <FutureRoadmap />
      <VerificationStandards />
      <Testimonials />

      <HowItWorks />
      <OldWayContrast />
      <ContrastSection />
      <FeaturesGrid />
      <TradesHowItWorks />
      <HomeownersHowItWorks />
      <GreenEnergySection />
      <WhatYouGet />
      <WhyDifferent />
      <PlatformPreview />
      <FounderNote />
      <VerificationStandards />
      <Testimonials />
      <SeeHowItWorks />
      <TradeVerificationExplainer />
      <SignUpSection />
      <Footer />
    </div>
  );
};

export default Index;
