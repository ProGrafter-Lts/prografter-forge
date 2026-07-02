import QuoteHealthCheckReport from "@/components/QuoteHealthCheckReport";

const mock = {
  checker_type: "homeowner",
  quality_score: 62,
  completeness_pct: 68,
  risk_level: "Medium" as const,
  project_confidence: "Medium" as const,
  recommended_next_step:
    "Request a revised quote that clearly states VAT, payment stages and the completion timeline before accepting.",
  top_issues: [
    "VAT status is not stated on the quote total",
    "Payment stages and deposit amount are not defined",
    "No completion date or programme is provided",
  ],
  what_to_do_next: [
    "Ask the builder to confirm whether the total includes VAT.",
    "Agree payment stages tied to clear milestones, not dates.",
    "Get the start date and expected duration in writing.",
    "Confirm what is excluded so there are no surprises later.",
  ],
  builder_message:
    "Hi, thanks for the quote. Before I decide, could you confirm: 1) Does the total include VAT? 2) What payment stages would you need? 3) When could you start and how long would it take? 4) What's excluded? Once confirmed, please send a revised quote. Thanks.",
  report_html: `
    <section><h2>Plain-English Summary</h2><p>This quote covers a single-storey rear extension with new kitchen fit-out. The headline price is competitive, but several commercial terms are missing which could affect the final cost.</p></section>
    <section><h2>Quote Figures</h2><div class="qr-figures"><ul><li>Labour: £18,400</li><li>Materials: £12,250</li><li>Total: £30,650</li></ul></div></section>
    <section><h2>What Appears Included</h2><ul><li>Groundworks and foundations</li><li>Brickwork and blockwork to match existing</li><li>Roofing and flat-roof covering</li><li>Standard electrical first and second fix</li></ul></section>
    <section><h2>What Is Missing or Unclear</h2><ul><li>VAT is not stated on the total</li><li>No payment schedule or deposit amount</li><li>No completion date or programme duration</li><li>Building control fees not mentioned</li></ul></section>
    <section><h2>What Appears Excluded</h2><ul><li>Kitchen appliances</li><li>Floor finishes</li><li>Decoration</li></ul></section>
    <section><h2>Score Breakdown</h2><table><tr><th>Area</th><th>Status</th></tr><tr><td>Scope</td><td>Good</td></tr><tr><td>Pricing clarity</td><td>Needs work</td></tr><tr><td>Terms</td><td>Missing</td></tr></table></section>
    <section><h2>Questions To Ask The Builder</h2><h3>Pricing</h3><ul><li>Does the total include VAT?</li><li>Is the price fixed or subject to change?</li></ul><h3>Programme</h3><ul><li>When can you start?</li><li>How long will the works take?</li></ul></section>
    <section><h2>Final Recommendation</h2><p>The quote is reasonable in scope but incomplete on commercial terms. Do not accept until VAT, payment stages and the programme are confirmed in writing. This protects both you and the builder.</p></section>
  `,
};

const ReportPreviewDev = () => (
  <div className="min-h-screen bg-slate-100 pt-10 pb-16 px-4">
    <div className="max-w-2xl mx-auto qr-print-area">
      <QuoteHealthCheckReport report={mock} />
    </div>
  </div>
);

export default ReportPreviewDev;
