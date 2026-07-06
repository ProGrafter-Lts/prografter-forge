import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_pricing",
  title: "Get pricing information",
  description:
    "Return how ProGrafter pricing works for trades and homeowners (commission model, job posting, AI Quote Checker).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: [
          "ProGrafter pricing overview. For live figures always refer to https://prografter.co.uk/pricing.",
          "",
          "- Homeowners: posting a job and receiving quotes is free.",
          "- Trades: a fair, transparent commission model with no lock-in.",
          "- AI Quote Checker: audits a homeowner's quote for clarity, VAT, scope and project-control gaps.",
          "",
          "Full, current pricing details and terms are published on the pricing page.",
        ].join("\n"),
      },
    ],
  }),
});
