import { useEffect } from "react";
import SEO from "@/components/SEO";
import { localBusinessJsonLd, homepageFaqJsonLd } from "@/lib/seoSchemas";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import HowItWorks from "@/components/HowItWorks";
import OldWayContrast from "@/components/OldWayContrast";
import GreenEnergySection from "@/components/GreenEnergySection";
import ContrastSection from "@/components/ContrastSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import TradesHowItWorks from "@/components/TradesHowItWorks";
import HomeownersHowItWorks from "@/components/HomeownersHowItWorks";
import WhatYouGet from "@/components/WhatYouGet";
import WhyDifferent from "@/components/WhyDifferent";
import PlatformPreview from "@/components/PlatformPreview";
import Testimonials from "@/components/Testimonials";
import SeeHowItWorks from "@/components/SeeHowItWorks";
import SignUpSection from "@/components/SignUpSection";
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
        title="ProGrafter — Commission-Only Trades Marketplace | Zero Monthly Fees"
        description="ProGrafter connects verified UK tradespeople with homeowners. Pay 7.5% only when a job completes — capped at £900. No monthly fees. Free to register. Free to post a job."
        path="/"
        jsonLd={[localBusinessJsonLd, homepageFaqJsonLd]}
      />
      <Navbar />
      <Hero />
      <Ticker />
      <HowItWorks />
      <OldWayContrast />
      <GreenEnergySection />
      <ContrastSection />
      <FeaturesGrid />
      <TradesHowItWorks />
      <HomeownersHowItWorks />
      <WhatYouGet />
      <WhyDifferent />
      <PlatformPreview />
      <SeeHowItWorks />
      <SignUpSection />
      <Footer />
    </div>
  );
};

export default Index;
