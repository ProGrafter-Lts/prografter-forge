import { useState } from "react";
import "./SeeHowItWorks.css";

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
        <div className="hiw-screen">
          <ChromeBar url="prografter.co.uk/dashboard/trade" />
          <div className="sc-body">
            <div className="greeting">
              Good morning, <em>James</em>
              <span className="verified-badge">✓ VERIFIED</span>
            </div>
            <div className="stat-row">
              <div className="stat-box"><div className="stat-n">8</div><div className="stat-l">Jobs Won</div></div>
              <div className="stat-box"><div className="stat-n">£4,572</div><div className="stat-l">Earned</div></div>
              <div className="stat-box"><div className="stat-n">2</div><div className="stat-l">Active</div></div>
              <div className="stat-box"><div className="stat-n">4.9★</div><div className="stat-l">Rating</div></div>
            </div>
            <div className="sec-lbl">New Job Matches — This Morning</div>
            <div className="job-card">
              <div className="jc-title">Full Rewire — 3-Bed Semi</div>
              <div className="jc-meta">📍 Worksop NG20 · 4.2 miles · Deposit paid ✓</div>
              <div className="jc-bottom">
                <div className="jc-val">£4,200 est.</div>
                <div className="jc-btn">View & Quote →</div>
              </div>
            </div>
            <div className="job-card">
              <div className="jc-title">EV Charger Installation</div>
              <div className="jc-meta">📍 Newark NG24 · 11 miles · 0 quotes yet</div>
              <div className="jc-bottom">
                <div className="jc-val">£950 est.</div>
                <div className="jc-btn">View & Quote →</div>
              </div>
            </div>
            <div className="sec-lbl" style={{ marginTop: 10 }}>Active Project</div>
            <div className="job-card">
              <div className="jc-title">Full Rewire — Mansfield NG18</div>
              <div className="jc-meta">Stage 3 of 5 · Day 8 · Update due today</div>
              <div className="prog"><div className="prog-fill" style={{ width: "60%" }} /></div>
            </div>
          </div>
        </div>
        <div className="screen-label">
          <div className="sl-title">Your Trade Dashboard</div>
          <div className="sl-sub">Jobs · Earnings · Active projects — all in one place</div>
        </div>
      </div>

      {/* Right column */}
      <div className="visual-right">
        {/* Available Jobs */}
        <div>
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/jobs" />
            <div className="jobs-body">
              <div className="job-big">
                <div className="jb-top">
                  <div className="jb-title">Rewire — 3-Bed Semi</div>
                  <div className="jb-val">£4,200</div>
                </div>
                <div className="jb-tags">
                  <span className="tag">Electrical</span>
                  <span className="tag new">NEW</span>
                </div>
                <div className="jb-desc">Worksop NG20 · 4mi · 1970s wiring, new CU required. Deposit paid.</div>
                <div className="jb-btn">Submit Your Quote →</div>
              </div>
              <div className="job-sm">
                <div><div className="jsm-title">EV Charger Install</div><div className="jsm-loc">📍 Newark NG24 · 11mi</div></div>
                <div className="jsm-val">£950</div>
              </div>
              <div className="job-sm">
                <div><div className="jsm-title">Consumer Unit Upgrade</div><div className="jsm-loc">📍 Kirkby NG17 · 2mi</div></div>
                <div className="jsm-val">£680</div>
              </div>
            </div>
          </div>
          <div className="screen-label">
            <div className="sl-title">Available Jobs</div>
            <div className="sl-sub">Matched to your trade · Within 20 miles</div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/project/PG-003" />
            <div className="timeline-body">
              <div className="proj-bar">
                <div className="pb-name">Full Rewire — Mansfield NG18</div>
                <div className="pb-prog"><div className="pb-fill" style={{ width: "65%" }} /></div>
                <div className="pb-pct">65% · Day 8 of 12</div>
              </div>
              <div className="stage">
                <div className="stage-dot sd-done">✓</div>
                <div><div className="stage-name done">Survey & Strip Out</div><div className="stage-note">Completed 28 Mar</div></div>
              </div>
              <div className="stage">
                <div className="stage-dot sd-done">✓</div>
                <div><div className="stage-name done">Consumer Unit Install</div><div className="stage-note">Completed 30 Mar</div></div>
              </div>
              <div className="stage">
                <div className="stage-dot sd-active" />
                <div>
                  <div className="stage-name active">First Fix — IN PROGRESS</div>
                  <div className="stage-note">Ground floor circuits started today.</div>
                  <div className="photo-row">
                    <div className="photo-thumb">📷</div>
                    <div className="photo-thumb">📷</div>
                  </div>
                </div>
              </div>
              <div className="stage">
                <div className="stage-dot sd-future" />
                <div><div className="stage-name future">Second Fix</div></div>
              </div>
              <div className="stage">
                <div className="stage-dot sd-future" />
                <div><div className="stage-name future">Test, Cert & Handover</div></div>
              </div>
            </div>
          </div>
          <div className="screen-label">
            <div className="sl-title">Live Project Timeline</div>
            <div className="sl-sub">Daily updates · Photo log · Stage sign-off</div>
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
        <div className="step-title">Receive Quotes</div>
        <div className="step-desc">Verified, insured local trades quote within 24 hours. Compare and choose with confidence.</div>
      </div>
      <div className="hiw-step">
        <div className="step-num">3</div>
        <div className="step-title">Track It Live</div>
        <div className="step-desc">Daily photo updates from site. Every stage visible. Homeowner Manual at completion.</div>
      </div>
    </div>

    {/* Screens */}
    <div className="visual-wrap">
      {/* Homeowner Dashboard - large */}
      <div>
        <div className="hiw-screen">
          <ChromeBar url="prografter.co.uk/dashboard/homeowner" />
          <div className="hw-body">
            <div className="proj-hero">
              <div className="ph-lbl">Active Project</div>
              <div className="ph-title">Full Rewire — 14 Birchwood Ave</div>
              <div className="ph-trade">James Carter · NICEIC Approved · ⭐ 4.9</div>
              <div className="ph-prog"><div className="ph-fill" style={{ width: "65%" }} /></div>
              <div className="ph-stats">
                <div className="ph-stat"><div className="n">65%</div><div className="l">Complete</div></div>
                <div className="ph-stat"><div className="n">Day 8</div><div className="l">of 12</div></div>
                <div className="ph-stat"><div className="n">12 Apr</div><div className="l">Est. Done</div></div>
              </div>
            </div>
            <div className="sec-lbl">Latest From Site</div>
            <div className="update-card">
              <div className="uc-icon">⚡</div>
              <div>
                <div className="uc-title">5 Apr — Ground floor circuits started</div>
                <div className="uc-text">Lounge and dining room done. Kitchen tomorrow. All notched and clipped.</div>
                <div className="uc-photos">📷 3 photos attached</div>
              </div>
            </div>
            <div className="update-card">
              <div className="uc-icon">✅</div>
              <div>
                <div className="uc-title">4 Apr — Upstairs complete</div>
                <div className="uc-text">All upstairs circuits done. Smoke detector base fitted.</div>
                <div className="uc-photos">📷 5 photos attached</div>
              </div>
            </div>
            <div className="var-alert" style={{ marginTop: 8 }}>
              <div className="var-badge">ACTION REQUIRED</div>
              <div className="var-title">Variation #1 — Additional earthing · £300</div>
              <div className="var-actions">
                <div className="var-approve">✓ Approve & Sign</div>
                <div className="var-query">Query</div>
              </div>
            </div>
          </div>
        </div>
        <div className="screen-label">
          <div className="sl-title">Your Project Dashboard</div>
          <div className="sl-sub">Live updates · Variation sign-off · Progress tracking</div>
        </div>
      </div>

      {/* Right column */}
      <div className="visual-right">
        {/* Quote Checker */}
        <div>
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/quote-checker" />
            <div className="qc-body">
              <div className="qc-score">
                <div className="qc-num">28<span>/43</span></div>
                <div className="qc-lbl">Checklist Items Addressed</div>
              </div>
              <div className="qc-item"><div className="qi-ico">✅</div><div className="qi-text">Labour costs itemised — £8,400</div></div>
              <div className="qc-item"><div className="qi-ico">✅</div><div className="qi-text">3-stage payment schedule</div></div>
              <div className="qc-item"><div className="qi-ico">❌</div><div className="qi-text miss">Scaffolding — NOT included</div></div>
              <div className="qc-item"><div className="qi-ico">❌</div><div className="qi-text miss">Building Control — NOT mentioned</div></div>
              <div className="qc-item"><div className="qi-ico">⚠️</div><div className="qi-text warn">Groundworks £500 — typically £3,000+</div></div>
            </div>
          </div>
          <div className="screen-label">
            <div className="sl-title">AI Quote Checker</div>
            <div className="sl-sub">43-point checklist · Know before you sign · £49</div>
          </div>
        </div>

        {/* Homeowner Manual */}
        <div>
          <div className="hiw-screen">
            <ChromeBar url="prografter.co.uk/manual/PG-003" />
            <div className="manual-body">
              <div className="manual-hero">
                <div className="mh-title">HOMEOWNER MANUAL</div>
                <div className="mh-addr">14 Birchwood Ave · Completed 12 Apr 2026</div>
              </div>
              <div className="manual-sec"><div className="ms-ico">📋</div><div className="ms-name">Project Overview</div><div className="ms-status">DONE</div></div>
              <div className="manual-sec"><div className="ms-ico">🔌</div><div className="ms-name">Materials & Specs</div><div className="ms-status">DONE</div></div>
              <div className="manual-sec"><div className="ms-ico">📜</div><div className="ms-name">Certificates</div><div className="ms-status">DONE</div></div>
              <div className="manual-sec"><div className="ms-ico">🛡️</div><div className="ms-name">Warranties (5yr)</div><div className="ms-status">DONE</div></div>
              <div className="manual-sec"><div className="ms-ico">📸</div><div className="ms-name">Photo Record</div><div className="ms-status">DONE</div></div>
            </div>
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
    <section className="hiw-section">
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
          This is exactly what ProGrafter looks like when you're using it. Real screens. Real flows. Nothing hidden.
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
            <a href="/trade-register" className="btn-p">Register as a Trade</a>
            <a href="/post-a-job" className="btn-s">Post a Job →</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeeHowItWorks;
