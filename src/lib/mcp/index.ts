import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import getPlatformOverviewTool from "./tools/get-platform-overview";
import getPricingTool from "./tools/get-pricing";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// (never from SUPABASE_URL). VITE_SUPABASE_PROJECT_ID is inlined at build time,
// keeping this entry import-safe. The fallback keeps the issuer well-formed
// during the throwaway manifest-extract eval.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "prografter-mcp",
  title: "ProGrafter MCP",
  version: "0.1.0",
  instructions:
    "Tools for ProGrafter, a UK construction trust platform. Use `get_platform_overview` to learn what ProGrafter is and how it works, `get_pricing` for the pricing model, and `echo` to verify connectivity.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getPlatformOverviewTool, getPricingTool, echoTool],
});
