// ICS calendar feed for trade users.
// Public endpoint — auth is via the unique calendar_token in the URL.
// Path: /functions/v1/ics-feed?token=<uuid>
// Custom URL: prografter.co.uk/cal/trade/<token>.ics  (proxied — see vite.config / hosting rewrite)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_BASE_URL = "https://prografter.co.uk";

// ----- ICS helpers -----
const pad = (n: number) => String(n).padStart(2, "0");

function fmtDate(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function fmtDateTime(d: Date): string {
  return `${fmtDate(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeText(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

// Fold long lines per RFC 5545 (max 75 octets)
function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    out.push((i === 0 ? "" : " ") + line.slice(i, i + 73));
    i += 73;
  }
  return out.join("\r\n");
}

interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  /** All-day start (YYYY-MM-DD) — exclusive of dtEnd */
  dateStart?: string;
  /** All-day end (YYYY-MM-DD) — exclusive */
  dateEnd?: string;
  /** Timed event (UTC Date) */
  dtStart?: Date;
  dtEnd?: Date;
  /** VALARM trigger like "-PT24H" or "-PT30M" */
  alarmTrigger?: string;
  url?: string;
}

function buildIcs(events: IcsEvent[]): string {
  const now = fmtDateTime(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProGrafter//Trade Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ProGrafter",
    "X-WR-CALDESC:Your ProGrafter project schedule",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${now}`);

    if (ev.dateStart) {
      lines.push(`DTSTART;VALUE=DATE:${ev.dateStart.replace(/-/g, "")}`);
      const end = ev.dateEnd ?? ev.dateStart;
      // DTEND for all-day is exclusive — add a day if same as start
      const endDate = new Date(end + "T00:00:00Z");
      if (!ev.dateEnd) endDate.setUTCDate(endDate.getUTCDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${fmtDate(endDate)}`);
    } else if (ev.dtStart) {
      lines.push(`DTSTART:${fmtDateTime(ev.dtStart)}`);
      lines.push(`DTEND:${fmtDateTime(ev.dtEnd ?? ev.dtStart)}`);
    }

    lines.push(fold(`SUMMARY:${escapeText(ev.summary)}`));
    if (ev.description) lines.push(fold(`DESCRIPTION:${escapeText(ev.description)}`));
    if (ev.location) lines.push(fold(`LOCATION:${escapeText(ev.location)}`));
    if (ev.url) lines.push(fold(`URL:${ev.url}`));

    if (ev.alarmTrigger) {
      lines.push("BEGIN:VALARM");
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:${escapeText(ev.summary)}`);
      lines.push(`TRIGGER:${ev.alarmTrigger}`);
      lines.push("END:VALARM");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function gbp(n: number | string | null | undefined): string {
  const num = Number(n ?? 0);
  if (!num) return "£0";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(num);
}

// Extract token from either ?token=xxx or path /something/<token>.ics
function extractToken(req: Request): string | null {
  const url = new URL(req.url);
  const qp = url.searchParams.get("token");
  if (qp) return qp.replace(/\.ics$/i, "");
  const m = url.pathname.match(/([0-9a-f-]{36})(?:\.ics)?$/i);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = extractToken(req);
    if (!token) {
      return new Response("Missing calendar token", {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: trade, error: tradeErr } = await supabase
      .from("trades")
      .select("id, name, company_name")
      .eq("calendar_token", token)
      .maybeSingle();

    if (tradeErr || !trade) {
      return new Response("Calendar not found", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    // Fetch matched job ids for this trade
    const { data: matches } = await supabase
      .from("job_matches")
      .select("job_id, status")
      .eq("trade_id", trade.id);

    const jobIds = (matches ?? []).map((m) => m.job_id);
    const wonJobIds = (matches ?? [])
      .filter((m) => m.status === "accepted" || m.status === "won")
      .map((m) => m.job_id);

    const events: IcsEvent[] = [];

    if (jobIds.length > 0) {
      // Pull jobs + stages + quotes in parallel
      const [jobsRes, stagesRes, quotesRes, homeownersRes] = await Promise.all([
        supabase
          .from("jobs")
          .select("id, title, job_type, address, postcode, description, homeowner_id, stage")
          .in("id", jobIds),
        supabase
          .from("project_stages")
          .select(
            "id, job_id, stage_name, stage_order, planned_start, planned_end, payment_amount, payment_status",
          )
          .in("job_id", jobIds)
          .order("stage_order", { ascending: true }),
        supabase
          .from("quotes")
          .select("id, job_id, amount, status, created_at")
          .eq("trade_id", trade.id)
          .in("job_id", jobIds),
        supabase
          .from("homeowners")
          .select("id, name"),
      ]);

      const jobs = jobsRes.data ?? [];
      const stages = stagesRes.data ?? [];
      const quotes = quotesRes.data ?? [];
      const homeowners = homeownersRes.data ?? [];
      const homeownerById = new Map(homeowners.map((h) => [h.id, h]));
      const jobById = new Map(jobs.map((j) => [j.id, j]));

      // 1. JOB WON → project start
      for (const job of jobs) {
        if (!wonJobIds.includes(job.id)) continue;
        const firstStage = stages
          .filter((s) => s.job_id === job.id)
          .sort((a, b) => a.stage_order - b.stage_order)[0];
        const startDate = firstStage?.planned_start;
        if (!startDate) continue;

        const homeowner = job.homeowner_id ? homeownerById.get(job.homeowner_id) : null;
        const jobQuote = quotes.find((q) => q.job_id === job.id);
        const value = jobQuote ? gbp(jobQuote.amount) : "TBC";

        events.push({
          uid: `job-start-${job.id}@prografter.co.uk`,
          summary: `ProGrafter: ${job.title || job.job_type} — Project Start`,
          dateStart: startDate,
          location: `${job.address}, ${job.postcode}`,
          description: [
            `Homeowner: ${homeowner?.name || "—"}`,
            `Address: ${job.address}, ${job.postcode}`,
            `Project value: ${value}`,
            "",
            `Open project: ${APP_BASE_URL}/project/${job.id}`,
          ].join("\n"),
          url: `${APP_BASE_URL}/project/${job.id}`,
        });
      }

      // 2. STAGES
      for (const stage of stages) {
        if (!stage.planned_start) continue;
        const job = jobById.get(stage.job_id);
        if (!job) continue;
        const projectName = job.title || job.job_type;
        events.push({
          uid: `stage-${stage.id}@prografter.co.uk`,
          summary: `ProGrafter: ${stage.stage_name} — ${projectName}`,
          dateStart: stage.planned_start,
          dateEnd: stage.planned_end ?? undefined,
          description: [
            `Project: ${projectName}`,
            `Address: ${job.address}, ${job.postcode}`,
            `Stage: ${stage.stage_name} (${stage.stage_order})`,
            "",
            `Manage stage: ${APP_BASE_URL}/project/${job.id}`,
          ].join("\n"),
          url: `${APP_BASE_URL}/project/${job.id}`,
        });

        // 4. PAYMENT MILESTONE — add a separate event on stage end if a payment is due
        if (stage.payment_amount && Number(stage.payment_amount) > 0) {
          const payDate = stage.planned_end ?? stage.planned_start;
          const homeowner = job.homeowner_id ? homeownerById.get(job.homeowner_id) : null;
          events.push({
            uid: `payment-${stage.id}@prografter.co.uk`,
            summary: `ProGrafter: Payment due — ${projectName}`,
            dateStart: payDate,
            description: [
              `Stage ${stage.stage_order} (${stage.stage_name}) payment of ${gbp(stage.payment_amount)} due from ${homeowner?.name || "homeowner"}.`,
              "",
              `Visit prografter.co.uk to request payment.`,
              `${APP_BASE_URL}/project/${job.id}`,
            ].join("\n"),
            url: `${APP_BASE_URL}/project/${job.id}`,
          });
        }
      }

      // 5. QUOTE DEADLINES — pending quotes get a 7-day-from-creation deadline reminder
      for (const quote of quotes) {
        if (quote.status !== "pending") continue;
        const job = jobById.get(quote.job_id);
        if (!job) continue;
        const created = new Date(quote.created_at);
        const deadline = new Date(created);
        deadline.setUTCDate(deadline.getUTCDate() + 7);

        events.push({
          uid: `quote-${quote.id}@prografter.co.uk`,
          summary: `ProGrafter: Quote deadline — ${job.title || job.job_type}`,
          dtStart: deadline,
          dtEnd: new Date(deadline.getTime() + 30 * 60 * 1000),
          alarmTrigger: "-PT24H",
          description: [
            `Quote of ${gbp(quote.amount)} for ${job.title || job.job_type} expires soon.`,
            `Address: ${job.address}, ${job.postcode}`,
            "",
            `Open project: ${APP_BASE_URL}/project/${job.id}`,
          ].join("\n"),
          url: `${APP_BASE_URL}/project/${job.id}`,
        });
      }
    }

    const ics = buildIcs(events);

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="prografter-${trade.id}.ics"`,
        "Cache-Control": "public, max-age=900",
      },
    });
  } catch (err) {
    console.error("ics-feed error", err);
    return new Response(`ICS feed error: ${err instanceof Error ? err.message : "unknown"}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});
