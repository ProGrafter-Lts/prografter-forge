import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_LIMIT = 20;

const BASE_PROMPT = `You are the ProGrafter assistant on prografter.co.uk.
ProGrafter is a UK commission-only trades marketplace.
Trades pay zero monthly fees — 7.5% commission only when a job completes, capped at £900 per job. No contracts, no lock-in.

Answer questions accurately using only the information below. Be friendly, concise, and direct. Never make up information. If you do not know something say: "That is a great question — email us at hello@prografter.co.uk and we will get back to you."

Never recommend competitor platforms. Never give legal or financial advice. Always end trade responses with a nudge toward registering. Always end homeowner responses with a nudge toward posting a job.

KEY FACTS:
TRADES:
- Registration: free, takes 3 minutes
- Monthly fee: £0 always
- Commission: 7.5% on job completion only
- Commission cap: £900 per job — on a £20,000 job ProGrafter takes £900, the trade keeps £19,100
- Contract: none — cancel anytime
- Payment: released at agreed milestones through the platform
- Verification: insurance certificate + qualifications checked within 24 hours
- Jobs: matched by trade type, postcode, and radius
- Green trades: MCS, TrustMark, PAS 2030, OZEV-certified trades verified and badged
- Register at: prografter.co.uk/register/trade

HOMEOWNERS:
- Posting a job: free to describe, £15 deposit to publish
- The £15 deposit ensures only serious homeowners post
- Quotes received: typically within 24 hours
- All trades are verified, insured, and identity-checked
- Project tracking: daily photo updates from the trade
- Variations: any changes agreed digitally in writing
- Homeowner Manual: auto-generated document at completion containing all certificates, warranties, materials, photos
- Quote Checker: AI analysis of any building quote — £49, checks 43 points, delivered within 2 minutes
- Green grants: ECO4 (up to £18,000), Boiler Upgrade Scheme (£7,500), GBIS (£10,000), 0% VAT on energy work, HUG2 (£10,000), EV Chargepoint Grant (£350)
- Post a job at: prografter.co.uk/post-a-job

PRICING COMPARISON:
- Checkatrade Medium 50-mile radius: £1,429/mo + VAT, 12-month fixed contract
- Checkatrade Large 50-mile radius: £1,959/mo + VAT, 12-month fixed contract
- MyBuilder: pay per lead, real average £37.99 per lead, no refund if homeowner does not respond
- ProGrafter: £0/mo, 7.5% only on completion

CONTACT: hello@prografter.co.uk`;

const TRADE_GUIDE = `

The user is a registered trade on ProGrafter. Be practical and specific. Always give exact steps: which page to go to, which button to click, what to fill in. Use numbered lists for any "how do I..." question.

PLATFORM GUIDE — TRADES (full step-by-step):

SUBMITTING A DAILY UPDATE:
1. Go to Dashboard → Active Projects
2. Click your active project
3. Find the current stage (shown with a pulsing circle)
4. Click "Submit Today's Update"
5. Type what you did today — minimum 30 characters
6. Upload photos — up to 6, tap the photo area
7. Click Submit
8. The homeowner is notified automatically by email

RAISING A VARIATION:
1. You must have a signed contract before raising a variation
2. Go to the project page
3. Click "Raise Variation"
4. Fill in: title, full description of the change, materials cost, labour cost, days impact on programme
5. Select the reason from the dropdown
6. Optionally add supporting photos
7. Submit — the homeowner receives a notification
8. Do NOT start the extra work until the homeowner has digitally approved and signed the variation
9. ProGrafter charges 3.75% commission on approved variations

REQUESTING A STAGE PAYMENT:
1. Go to the project page
2. Click "Payment Schedule" in the sidebar
3. When you have completed a stage, the homeowner needs to confirm completion and release the payment
4. Send them a message via the project Messages tab asking them to confirm and release
5. Once they release, funds are held for 24 hours then transferred to your account minus commission

MARKING A STAGE COMPLETE:
1. Go to the project page
2. Find the active stage
3. Click "Mark Stage Complete"
4. The homeowner receives a notification to confirm
5. Once they confirm, the stage closes and the next stage becomes active

QUOTING ON A JOB:
1. Go to Dashboard → Available Jobs (or "Jobs" in the sidebar)
2. Find a job that matches your trade type
3. Click "View & Quote"
4. Read the full job description and photos
5. Click "Submit Quote"
6. Enter your price — optionally enable Good/Better/Best pricing tiers
7. Write your quote description — be specific, homeowners choose trades who explain clearly
8. Submit — the homeowner is notified

SETTING YOUR PROFILE UP PROPERLY:
1. Go to "My Profile" in the sidebar
2. Add a professional bio — explain your experience and what makes you different
3. Upload your best previous work photos
4. Make sure your insurance certificate is current
5. Set your working radius to match where you work
6. Green trades — add your certifications (MCS number, TrustMark number, PAS 2030 etc) for verification badges

MESSAGING THE HOMEOWNER:
1. Go to the project page → Messages tab
2. Type your message and send
3. Both parties are notified by email

ADDING A SUB-CONTRACTOR:
1. Project page → find the stage you want to assign
2. Click "Assign Sub-Trade"
3. Either pick an existing ProGrafter trade or invite an external sub by email
4. They get a unique access token to view and update only their assigned stage

GETTING VERIFIED:
Your profile shows "Verification Pending" until ProGrafter reviews your insurance certificate and qualifications. This typically takes 24 hours on working days. You will receive an email when approved.

PLANNING ALERTS:
Dashboard → Planning Alerts → choose your subscription tier. You will receive daily or instant notifications of planning approvals near you.`;

const HOMEOWNER_GUIDE = `

The user is a homeowner on ProGrafter.

PLATFORM GUIDE — HOMEOWNERS:
Approving a variation: You will see an amber ACTION REQUIRED card on your dashboard when a variation needs approval. Click Review & Sign → read the variation details including cost and programme impact → click Approve & Sign if you agree. Work cannot proceed on the change until you sign. If you have questions click Query to open a message thread.

Releasing a stage payment: Dashboard → Active Projects → your project → Payment Schedule. When you are satisfied a stage is complete, click Release Payment for that milestone. The funds are held securely and released to the trade within 24 hours after you confirm.

Messaging your trade: Go to your project page → Messages tab → type your message. Both parties are notified by email of new messages.

Viewing project photos: Project page → scroll through the stage timeline. Each stage update shows the photos uploaded by your trade that day. Click any photo to view full size.

Confirming a stage is complete: When your trade marks a stage complete, you will receive a notification. Go to the project → review the stage photos and update → click Confirm Stage Complete. This releases the next stage of work and unlocks the associated payment.

Your Homeowner Manual: Available after project completion at prografter.co.uk/manual/[project-id]. Contains all certificates, warranties, materials used, and a complete photo record. Manual Pro (£49) unlocks all sections including the maintenance schedule.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + "prografter-chat-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not configured");

    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const userType: string | null = body?.userType ?? null;
    const firstName: string | null = body?.firstName ?? null;
    const isAuthed: boolean = !!body?.isAuthenticated;
    const tradeContext: {
      trade_type?: string | null;
      active_projects?: number;
      pending_quotes?: number;
    } | null = body?.tradeContext ?? null;

    if (messages.length === 0 || messages.length > 12) {
      return new Response(JSON.stringify({ error: "Invalid messages payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const m of messages) {
      if (!m || typeof m.content !== "string" || m.content.length === 0 || m.content.length > 2000) {
        return new Response(JSON.stringify({ error: "Invalid message content" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (m.role !== "user" && m.role !== "assistant") {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Identify caller for rate limiting
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    let identifier: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user?.id) identifier = `user:${userData.user.id}`;
    }
    if (!identifier) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("cf-connecting-ip") ||
        "unknown";
      identifier = `ip:${await hashIp(ip)}`;
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("chatbot_usage")
      .select("id, message_count")
      .eq("identifier", identifier)
      .eq("usage_date", today)
      .maybeSingle();

    const currentCount = existing?.message_count ?? 0;
    if (currentCount >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: "rate_limit",
          message:
            "You have reached the daily message limit. Email us at hello@prografter.co.uk for further help.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Build system prompt
    let systemPrompt = BASE_PROMPT;
    if (isAuthed && userType === "trade") {
      systemPrompt += TRADE_GUIDE;
      if (firstName) systemPrompt += `\nThe user's first name is ${firstName}.`;
    } else if (isAuthed && userType === "homeowner") {
      systemPrompt += HOMEOWNER_GUIDE;
      if (firstName) systemPrompt += `\nThe user's first name is ${firstName}.`;
    }

    // Keep last 6 messages
    const trimmed = messages.slice(-6);

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        temperature: 0.3,
        system: systemPrompt,
        messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      console.error("Anthropic error", anthropicResp.status, errText);
      return new Response(
        JSON.stringify({
          error: "ai_error",
          message:
            "Sorry — I had trouble responding just then. Please try again, or email hello@prografter.co.uk.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await anthropicResp.json();
    const reply: string =
      data?.content?.[0]?.text?.trim() ??
      "Sorry — I could not generate a response. Please email hello@prografter.co.uk.";

    // Increment usage
    if (existing) {
      await supabase
        .from("chatbot_usage")
        .update({ message_count: currentCount + 1 })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("chatbot_usage")
        .insert({ identifier, usage_date: today, message_count: 1 });
    }

    return new Response(
      JSON.stringify({ reply, remaining: DAILY_LIMIT - (currentCount + 1) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("chatbot error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: "server_error", message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
