import SEO from "@/components/SEO";
import { localBusinessJsonLd, homepageFaqJsonLd } from "@/lib/seoSchemas";
import HomeownerNav from "@/components/home/HomeownerNav";
import HomeownerHero from "@/components/home/HomeownerHero";
import ThreeWaysPanel from "@/components/home/ThreeWaysPanel";
import FiveChecksBand from "@/components/home/FiveChecksBand";
import FourStepsSection from "@/components/home/FourStepsSection";
import DifferentApproach from "@/components/home/DifferentApproach";
import FinalCtaBand from "@/components/home/FinalCtaBand";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-deep">
      <SEO
        title="ProGrafter — Home Building Work, Without The Guesswork"
        description="Check quotes, find verified trades and manage your project with clarity. ProGrafter gives UK homeowners the confidence to build, renovate and improve — the right way."
        path="/"
        jsonLd={[localBusinessJsonLd, homepageFaqJsonLd]}
      />
      <HomeownerNav />
      <main>
        <HomeownerHero />
        <ThreeWaysPanel />
        <FiveChecksBand />
        <FourStepsSection />
        <DifferentApproach />
        <FinalCtaBand />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
