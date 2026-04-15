import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import HowItWorks from "@/components/HowItWorks";
import ContrastSection from "@/components/ContrastSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import TradesHowItWorks from "@/components/TradesHowItWorks";
import HomeownersHowItWorks from "@/components/HomeownersHowItWorks";
import WhatYouGet from "@/components/WhatYouGet";
import WhyDifferent from "@/components/WhyDifferent";
import PlatformPreview from "@/components/PlatformPreview";
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
      <Navbar />
      <Hero />
      <Ticker />
      <HowItWorks />
      <ContrastSection />
      <FeaturesGrid />
      <TradesHowItWorks />
      <HomeownersHowItWorks />
      <WhatYouGet />
      <WhyDifferent />
      <PlatformPreview />
      <SignUpSection />
      <Footer />
    </div>
  );
};

export default Index;
