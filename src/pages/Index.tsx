import SEO from "@/components/SEO";
import { localBusinessJsonLd, homepageFaqJsonLd } from "@/lib/seoSchemas";
import HomeownerNav from "@/components/home/HomeownerNav";
import HomeownerHero from "@/components/home/HomeownerHero";
import ThreeWaysPanel from "@/components/home/ThreeWaysPanel";
import FiveChecksBand from "@/components/home/FiveChecksBand";
import FourStepsSection from "@/components/home/FourStepsSection";
import DifferentApproach from "@/components/home/DifferentApproach";
import FinalCtaBand from "@/components/home/FinalCtaBand";
import LaunchFocusBand from "@/components/LaunchFocusBand";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="ProGrafter — Home Building Work, Without The Guesswork"
        description="Compare clearer quotes, meet up to three verified trades and manage your home project in one shared place. Focused first on the East Midlands."
        path="/"
        jsonLd={[localBusinessJsonLd, homepageFaqJsonLd]}
      />
      <HomeownerNav />
      <main>
        <HomeownerHero />
        <ThreeWaysPanel />
        <FiveChecksBand />
        <FourStepsSection />
        <LaunchFocusBand />
        <DifferentApproach />
        <FinalCtaBand />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
