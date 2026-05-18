import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

import tradeDashboard from "@/assets/platform/trade-dashboard.png";
import tradeJobs from "@/assets/platform/trade-jobs.png";
import tradeEarnings from "@/assets/platform/trade-earnings.png";
import homeownerOverview from "@/assets/platform/homeowner-overview.png";
import homeownerQuotes from "@/assets/platform/homeowner-quotes.png";
import homeownerManual from "@/assets/platform/homeowner-manual.png";

const BrowserFrame = ({
  src,
  alt,
  caption,
  url,
}: {
  src: string;
  alt: string;
  caption: string;
  url: string;
}) => (
  <div className="flex flex-col gap-3">
    <div
      className="rounded-xl overflow-hidden border shadow-2xl"
      style={{
        backgroundColor: "#0F2238",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ backgroundColor: "#0B1A2C", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div
          className="ml-3 px-2 py-0.5 rounded text-[9px] font-mono truncate"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}
        >
          {url}
        </div>
      </div>
      {/* Screenshot */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="block w-full h-auto"
        style={{ backgroundColor: "#0F2238" }}
      />
    </div>
    <p className="font-body text-secondary-text text-sm text-center max-w-[320px] mx-auto">
      {caption}
    </p>
  </div>
);

const PlatformPreview = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            Platform Preview
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-12">
          The Platform. See It In Action.
        </h2>

        {/* Tabs */}
        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="bg-navy/40 border border-cream/10 p-1 mb-10">
            <TabsTrigger
              value="trades"
              className="font-heading text-sm tracking-wide px-6 py-2 text-cream/50 data-[state=active]:bg-teal data-[state=active]:text-cream data-[state=active]:shadow-none"
            >
              FOR TRADES
            </TabsTrigger>
            <TabsTrigger
              value="homeowners"
              className="font-heading text-sm tracking-wide px-6 py-2 text-cream/50 data-[state=active]:bg-teal data-[state=active]:text-cream data-[state=active]:shadow-none"
            >
              FOR HOMEOWNERS
            </TabsTrigger>
          </TabsList>

          <p className="font-body italic text-[12px] text-cream/70 mb-8 -mt-4">
            Actual screenshots of the live platform. Dashboards populate as your jobs and quotes flow through.
          </p>

          <TabsContent value="trades">
            <div className="grid grid-cols-1 craft:grid-cols-3 gap-8">
              <BrowserFrame
                src={tradeDashboard}
                alt="Trade dashboard with stats, earnings, and job matches"
                url="prografter.co.uk/dashboard/trade"
                caption="Your dashboard — stats, earnings, and new job matches at a glance."
              />
              <BrowserFrame
                src={tradeJobs}
                alt="Available jobs view for trades"
                url="prografter.co.uk/dashboard/trade"
                caption="Browse matched jobs near you and submit quotes directly."
              />
              <BrowserFrame
                src={tradeEarnings}
                alt="Trade earnings view"
                url="prografter.co.uk/dashboard/trade"
                caption="Track every payment — commission, what you keep, paid status."
              />
            </div>
          </TabsContent>

          <TabsContent value="homeowners">
            <div className="grid grid-cols-1 craft:grid-cols-3 gap-8">
              <BrowserFrame
                src={homeownerOverview}
                alt="Homeowner overview with active projects and quotes"
                url="prografter.co.uk/dashboard/homeowner"
                caption="See your active project status, quotes received, and quick links."
              />
              <BrowserFrame
                src={homeownerQuotes}
                alt="Side-by-side quote comparison"
                url="prografter.co.uk/project/compare"
                caption="Compare quotes side-by-side with fairness scoring built in."
              />
              <BrowserFrame
                src={homeownerManual}
                alt="Homeowner project manual"
                url="prografter.co.uk/manual"
                caption="Your project manual — materials, certs, warranties, ready as a PDF."
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA link */}
        <div className="mt-14 text-center fade-up">
          <a
            href="#see-how-it-works"
            className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors group"
          >
            Full platform preview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
