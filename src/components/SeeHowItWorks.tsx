import { useState } from "react";
import "./SeeHowItWorks.css";

import tradeDashboard from "@/assets/platform/trade-dashboard.png";
import tradeJobs from "@/assets/platform/trade-jobs.png";
import tradeEarnings from "@/assets/platform/trade-earnings.png";
import homeownerOverview from "@/assets/platform/homeowner-overview.png";
import homeownerQuotes from "@/assets/platform/homeowner-quotes.png";
import homeownerManual from "@/assets/platform/homeowner-manual.png";
import quoteChecker from "@/assets/platform/quote-checker.png";

const ChromeBar = ({ url }: { url: string }) => (
  <div className="chrome">
    <div className="dots">
      <div className="dot dr" />
      <div className="dot dy" />
      <div className="dot dg" />
    </div>
    <div className="url">{url}</div>
  </div>
);

const Disclaimer = () => (
  <p className="font-mono text-[11px] text-white/[0.55] text-center mb-2">
    Illustrative preview — your dashboard fills in as real work flows through.
  </p>
);

const ScreenShot = ({ src, alt }: { src: string; alt: string }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    style={{ display: "block", width: "100%", height: "auto", backgroundColor: "#0F2238" }}
  />
);

/* ═══════════════════════════════════════
   TRADES TAB
   ═══════════════════════════════════════ */
const TradesPanel = () => (
  <div>
    {/* Steps */}
    <div className="steps-flow">
      <div className="hiw-step">
        <div className="step-num">1</div>
        <div className="step-title">Register Free</div>
        <div className="step-desc">Upload your details, trade type, and insurance certificate. Verified within 24hrs.</div>
      </div>
      <div className="hiw-step">
        <div className="step-num">2</div>
        <div className="step-title">Get Matched to Jobs</div>
        <div className="step-desc">Instant alerts when a relevant job posts within 20 miles. Submit your quote in minutes.</div>
      </div>
      <div className="hiw-step">
        <div className="step-num">3</div>
        <div className="step-title">Complete & Get Paid</div>
        <div className="step-desc">Manage the project live. Get paid at each stage. 7.5% commission only on completion.</div>
      </div>
    </div>

    {/* Screens */}
    <div className="visual-wrap">
      {/* Trade Dashboard - large */}
      <div>
        <Disclaimer />
        <div className="hiw-screen">
          <ChromeBar url="prografter.co.uk/dashboard/trade" />
          <ScreenShot src={tradeDashboard} alt="Trade dashboard with stats and job matches" />
        </div>
        <div className="screen-label">
          <div className="sl-title">Your Trade Dashboard</div>
          <div className="sl-sub">Jobs · Earnings · Active projects — all in one place</div>
        </div>
      </div>

      {/* Right column */}
      <div className="visual-right">
        <div>
          <Disclaimer />
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/dashboard/trade" />
            <ScreenShot src={tradeJobs} alt="Available jobs view for trades" />
          </div>
          <div className="screen-label">
            <div className="sl-title">Available Jobs</div>
            <div className="sl-sub">Matched to your trade · Within 20 miles</div>
          </div>
        </div>

        <div>
          <Disclaimer />
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/dashboard/trade" />
            <ScreenShot src={tradeEarnings} alt="Trade earnings view" />
          </div>
          <div className="screen-label">
            <div className="sl-title">Earnings & Payments</div>
            <div className="sl-sub">Stage payments · Commission breakdown · Paid status</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   HOMEOWNERS TAB
   ═══════════════════════════════════════ */
const HomeownersPanel = () => (
  <div>
    {/* Steps */}
    <div className="steps-flow">
      <div className="hiw-step">
        <div className="step-num">1</div>
        <div className="step-title">Post Your Job Free</div>
        <div className="step-desc">Describe the work. Add photos. Set a rough budget. Takes under 3 minutes.</div>
      </div>
      <div className="hiw-step">
        <div className="step-num">2</div>
        <div className="step-title">Receive & Compare Quotes</div>
        <div className="step-desc">Verified, insured local trades quote within 24 hours. Compare and choose with confidence.</div>
      </div>
      <div className="hiw-step">
        <div className="step-num">3</div>
        <div className="step-title">Track It & Keep The Manual</div>
        <div className="step-desc">Live updates from site. Every stage visible. Homeowner Manual ready at completion.</div>
      </div>
    </div>

    {/* Screens */}
    <div className="visual-wrap">
      {/* Homeowner Dashboard - large */}
      <div>
        <Disclaimer />
        <div className="hiw-screen">
          <ChromeBar url="prografter.co.uk/dashboard/homeowner" />
          <ScreenShot src={homeownerOverview} alt="Homeowner overview with active project and quotes" />
        </div>
        <div className="screen-label">
          <div className="sl-title">Your Project Dashboard</div>
          <div className="sl-sub">Active project · Quotes received · Live status</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <Disclaimer />
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/project/compare" />
            <ScreenShot src={homeownerQuotes} alt="Side-by-side quote comparison" />
          </div>
          <div className="screen-label">
            <div className="sl-title">Compare Quotes Side-by-Side</div>
            <div className="sl-sub">Price · Timeline · Certificates · Warranty</div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="visual-right">
        <div>
          <Disclaimer />
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/quote-checker" />
            <ScreenShot src={quoteChecker} alt="AI Quote Checker tool" />
          </div>
          <div className="screen-label">
            <div className="sl-title">AI Quote Checker</div>
            <div className="sl-sub">43-point checklist · Know before you sign · £49</div>
          </div>
        </div>

        <div>
          <Disclaimer />
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/manual" />
            <ScreenShot src={homeownerManual} alt="Homeowner project manual" />
          </div>
          <div className="screen-label">
            <div className="sl-title">Homeowner Manual</div>
            <div className="sl-sub">Auto-generated at completion · Yours forever</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════ */
const SeeHowItWorks = () => {
  const [activeTab, setActiveTab] = useState<"trades" | "homeowners">("trades");

  return (
    <section id="see-how-it-works" className="hiw-section">
      <div className="hiw-container">
        {/* Header */}
        <div className="flex items-center gap-[10px] mb-3">
          <div className="w-7 h-px bg-secondary" />
          <span className="font-mono text-[10px] text-secondary tracking-[2.5px] uppercase">
            How It Works
          </span>
        </div>
        <h2 className="font-heading text-white text-[50px] leading-[0.95] tracking-[1.5px] mb-[10px]">
          SEE IT.<br />
          <span className="text-secondary">BEFORE YOU SIGN UP.</span>
        </h2>
        <p className="text-[14px] text-white/40 leading-[1.6] max-w-[520px] mb-11">
          Actual screenshots from the live platform. Real screens. Real flows. Nothing hidden.
        </p>

        {/* Tabs */}
        <div className="hiw-tabs">
          <button
            className={`hiw-tab ${activeTab === "trades" ? "active" : ""}`}
            onClick={() => setActiveTab("trades")}
          >
            🔧 I'm a Tradesperson
          </button>
          <button
            className={`hiw-tab ${activeTab === "homeowners" ? "active" : ""}`}
            onClick={() => setActiveTab("homeowners")}
          >
            🏠 I'm a Homeowner
          </button>
        </div>

        {/* Panels */}
        {activeTab === "trades" ? <TradesPanel /> : <HomeownersPanel />}

        {/* Bottom CTA */}
        <div className="bottom-strip">
          <div className="bs-text">
            <div className="t">SEEN ENOUGH?<br />LET'S GET STARTED.</div>
            <div className="s">Free to register · Free to post · Pay only when work completes</div>
          </div>
          <div className="bs-btns">
            <a href="/register/trade" className="btn-p">Register as a Trade</a>
            <a href="/post-a-job" className="btn-s">Post a Job →</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeeHowItWorks;
