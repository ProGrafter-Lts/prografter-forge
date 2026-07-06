import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_platform_overview",
  title: "Get platform overview",
  description:
    "Return an overview of ProGrafter: what it is, who it's for (trades and homeowners), and how it works.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: [
          "ProGrafter is a premium UK construction trust platform (not a trades directory).",
          "",
          "For homeowners: post a job, receive quotes from verified trades, use the AI Quote Checker to audit quotes, then manage the project (stages, payments, variations, messaging) end-to-end.",
          "",
          "For trades: get matched to relevant local jobs, submit quotes, and run projects with stage payments, variations, site updates and messaging.",
          "",
          "Trust is platform-wide: 5-Step Trade Verification, Homeowner Verification, Two-Way Reviews, Manual Job Review, Privacy & Security, AI Transparency, Fair Pricing and Dispute Resolution. See the Trust Centre at https://prografter.co.uk/trust.",
        ].join("\n"),
      },
    ],
  }),
});
