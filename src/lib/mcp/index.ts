import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import getPlatformOverviewTool from "./tools/get-platform-overview";
import getPricingTool from "./tools/get-pricing";

export default defineMcp({
  name: "prografter-mcp",
  title: "ProGrafter MCP",
  version: "0.1.0",
  instructions:
    "Tools for ProGrafter, a UK construction trust platform. Use `get_platform_overview` to learn what ProGrafter is and how it works, `get_pricing` for the pricing model, and `echo` to verify connectivity.",
  tools: [getPlatformOverviewTool, getPricingTool, echoTool],
});
