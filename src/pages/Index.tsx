import { useEffect } from "react";
import SEO from "@/components/SEO";
import { localBusinessJsonLd, homepageFaqJsonLd } from "@/lib/seoSchemas";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AtlasAlphaCTA from "@/components/AtlasAlphaCTA";
import WhyProGrafter from "@/components/WhyProGrafter";
import TrustStats from "@/components/TrustStats";
import WhereAreYouSection from "@/components/WhereAreYouSection";
import HowItWorks from "@/components/HowItWorks";
import OldWayContrast from "@/components/OldWayContrast";
import VerificationStandards from "@/components/VerificationStandards";
import Testimonials from "@/components/Testimonials";
import SignUpSection from "@/components/SignUpSection";
import AiQuoteCheckerDemo from "@/components/demos/AiQuoteCheckerDemo";
import TrustCentreBand from "@/components/TrustCentreBand";
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
      <AiQuoteCheckerDemo />
      <WhyProGrafter />
      <WhereAreYouSection />
      <HowItWorks />
      <OldWayContrast />
      <VerificationStandards />
      <TrustCentreBand />
      <TrustStats />
      <Testimonials />
      <SignUpSection />
      <Footer />
    </div>
  );
};

export default Index;
