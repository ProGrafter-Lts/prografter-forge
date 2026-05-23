import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

const C = {
  cream:"#F5F0E8", deep:"#0F2238", navy:"#1B3A5C",
  teal:"#0D9488", tealLight:"#CCFBF1",
  body:"#1F2937", secondary:"#4B5563", border:"#D1CBB8", white:"#FFFFFF",
  amber:"#D97706", amberBg:"#FFFBEB", amberBorder:"#FDE68A",
  green:"#16A34A", greenBg:"#F0FDF4", greenBorder:"#BBF7D0",
  red:"#DC2626", dimText:"rgba(245,240,232,0.78)", brightText:"#F5F0E8",
};

const TRADER_DIMENSIONS = [
  { id:"workmanship_rating",   label:"Quality of work" },
  { id:"communication_rating", label:"Communication" },
  { id:"reliability_rating",   label:"Timekeeping" },
  { id:"tidiness_rating",      label:"Tidiness & respect" },
  { id:"value_rating",         label:"Value for money" },
];
const HOMEOWNER_DIMENSIONS = [
  { id:"trade_access_rating",        label:"Access provided" },
  { id:"trade_communication_rating", label:"Communication" },
  { id:"trade_payment_rating",       label:"Payment conduct" },
  { id:"trade_scope_rating",         label:"Scope respect" },
  { id:"trade_reasonable_rating",    label:"Reasonableness" },
];

const OverallScore = ({ score, size="lg" }: { score: number; size?: "lg"|"sm" }) => {
  const colour = score >= 4.5 ? C.green : score >= 3.5 ? C.teal : score >= 2.5 ? C.amber : C.red;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize: size==="lg" ? 28 : 20, fontWeight:700, color:colour }}>{score.toFixed(1)}</span>
      <div>
        <div style={{ display:"flex", gap:2 }}>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ width: size==="lg" ? 14 : 10, height: size==="lg" ? 14 : 10, borderRadius:"50%", background: n <= Math.round(score) ? colour : "#E5E1D8" }} />
          ))}
        </div>
        <p style={{ fontSize:10, color:C.secondary, margin:"2px 0 0" }}>out of 5</p>
      </div>
    </div>
  );
};

const ReviewCard = ({ review, showTraderView }: any) => {
  const [expanded, setExpanded] = useState(false);
  const DimBar = ({ label, score }: any) => (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
      <span style={{ fontSize:11, color:C.secondary, width:120, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, height:5, borderRadius:3, background:"#E5E1D8", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:3, background: score>=4 ? C.green : score>=3 ? C.teal : C.amber, width:`${(score/5)*100}%` }} />
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:C.navy, width:16, textAlign:"right" }}>{score}</span>
    </div>
  );

  return (
    <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:14 }}>
      <div style={{ background:C.deep, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:C.brightText, margin:"0 0 2px" }}>
            {review.job_title || "Job"} · {review.area || ""}
          </p>
          <p style={{ fontSize:11, color:C.dimText, margin:0 }}>
            {review.job_ref} · Published {new Date(review.published_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
          </p>
        </div>
        {review.homeowner_overall != null && (
          <OverallScore score={Number(review.homeowner_overall)} size="sm" />
        )}
      </div>

      <div style={{ padding:"14px 16px" }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.teal, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>
            {review.homeowner_name} reviewed {review.trader_name}
          </p>
          {review.body && (
            <p style={{ fontSize:13, color:C.body, lineHeight:1.7, margin:"0 0 10px", fontStyle:"italic" }}>
              "{review.body}"
            </p>
          )}
          {expanded && (
            <div style={{ marginTop:8 }}>
              {TRADER_DIMENSIONS.map(d => (
                review[d.id] != null && <DimBar key={d.id} label={d.label} score={review[d.id]} />
              ))}
            </div>
          )}
        </div>

        {showTraderView && review.trade_review_comment && (
          <div style={{ borderTop:`1px solid ${C.cream}`, paddingTop:12 }}>
            <p style={{ fontSize:11, fontWeight:700, color:C.navy, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>
              {review.trader_name} reviewed {review.homeowner_name}
            </p>
            <p style={{ fontSize:12, color:C.secondary, lineHeight:1.65, margin:"0 0 8px", fontStyle:"italic" }}>
              "{review.trade_review_comment}"
            </p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {HOMEOWNER_DIMENSIONS.map(d => (
                review[d.id] != null && (
                  <div key={d.id} style={{ background:C.cream, borderRadius:8, padding:"4px 8px", fontSize:10 }}>
                    <span style={{ color:C.secondary }}>{d.label}: </span>
                    <span style={{ fontWeight:600, color:C.navy }}>{review[d.id]}/5</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        <button onClick={() => setExpanded(s => !s)} style={{ marginTop:10, background:"none", border:"none", color:C.teal, fontSize:12, fontWeight:600, cursor:"pointer", padding:0 }}>
          {expanded ? "Show less ↑" : "Show dimension breakdown ↓"}
        </button>
      </div>
    </div>
  );
};

export default function TraderReviews() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [trader, setTrader] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showTraderReviews, setShowTraderReviews] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: tRows }, { data: rvs }] = await Promise.all([
        supabase.rpc("get_public_trade", { _id: id }),
        supabase.from("reviews").select("*").eq("trade_id", id).not("published_at", "is", null).order("published_at", { ascending: false }),
      ]);
      const t = Array.isArray(tRows) ? tRows[0] : tRows;
      setTrader(t);

      // enrich with job + homeowner info
      const enriched = await Promise.all((rvs ?? []).map(async (r: any) => {
        const [{ data: job }, { data: ho }] = await Promise.all([
          supabase.from("jobs").select("title,job_type,ref,postcode").eq("id", r.job_id).maybeSingle(),
          supabase.from("homeowners").select("name").eq("id", r.homeowner_id).maybeSingle(),
        ]);
        const initial = ho?.name?.split(" ")?.[0] ?? "Homeowner";
        const lastInitial = ho?.name?.split(" ")?.[1]?.[0] ?? "";
        return {
          ...r,
          job_title: job?.title ?? job?.job_type ?? "Job",
          job_ref: job?.ref ?? "",
          area: job?.postcode?.split(" ")?.[0] ?? "",
          homeowner_name: lastInitial ? `${initial} ${lastInitial}.` : initial,
          trader_name: t?.name ?? "Trader",
        };
      }));
      setReviews(enriched);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div style={{ minHeight:"100vh", background:C.cream, display:"flex", alignItems:"center", justifyContent:"center", color:C.secondary }}>Loading…</div>;
  }
  if (!trader) {
    return (
      <div style={{ minHeight:"100vh", background:C.cream, padding:"3rem 1rem" }}>
        <div style={{ maxWidth:480, margin:"0 auto", background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"1.5rem", textAlign:"center" }}>
          <p style={{ fontSize:15, fontWeight:600, color:C.deep }}>Trader not found.</p>
          <Link to="/" style={{ display:"inline-block", marginTop:12, color:C.teal, fontWeight:600 }}>← Back home</Link>
        </div>
      </div>
    );
  }

  const overallAvg = reviews.length
    ? reviews.reduce((s, r) => s + (Number(r.homeowner_overall) || 0), 0) / reviews.length
    : 0;
  const dimAvgs: Record<string, number> = {};
  TRADER_DIMENSIONS.forEach(d => {
    const vals = reviews.map(r => Number(r[d.id])).filter(v => !isNaN(v) && v > 0);
    if (vals.length) dimAvgs[d.id] = vals.reduce((s, v) => s + v, 0) / vals.length;
  });

  const reviewSchemas = reviews
    .filter((r) => r.homeowner_overall != null)
    .map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: Number(r.homeowner_overall), bestRating: 5 },
      author: { "@type": "Person", name: r.homeowner_name },
      datePublished: r.published_at,
      reviewBody: r.body ?? undefined,
    }));

  const traderJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: trader.company_name || trader.name,
    description: `${trader.trade_type} based in ${trader.postcode}`,
    address: { "@type": "PostalAddress", postalCode: trader.postcode, addressCountry: "GB" },
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(overallAvg.toFixed(2)),
            reviewCount: reviews.length,
            bestRating: 5,
          },
          review: reviewSchemas,
        }
      : {}),
  };

  return (
    <div style={{ minHeight:"100vh", background:C.cream }}>
      <SEO
        title={`${trader.name} · ${trader.company_name ?? ""} reviews · ProGrafter`}
        description={`Verified reviews for ${trader.name}${trader.company_name ? ` (${trader.company_name})` : ""} on ProGrafter.`}
        path={`/traders/${id}/reviews`}
        jsonLd={traderJsonLd}
      />

      <div style={{ background:C.deep, padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <Link to="/" className="font-heading tracking-wider" style={{ fontSize:24, textDecoration:"none" }}>
          <span style={{ color:C.brightText }}>PRO</span>
          <span style={{ color:C.teal }}>GRAFTER</span>
        </Link>
        <span style={{ fontSize:12, color:C.dimText, fontWeight:500, letterSpacing:"0.05em" }}>TRADER PROFILE</span>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"1.5rem 1rem" }}>
        <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"1.25rem", marginBottom:20 }}>
          <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:reviews.length ? 16 : 0, paddingBottom:reviews.length ? 16 : 0, borderBottom:reviews.length ? `1px solid ${C.cream}` : "none" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:C.deep, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, color:C.brightText }}>🔨</div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:17, fontWeight:700, color:C.deep, margin:"0 0 2px" }}>{trader.name}</h1>
              <p style={{ fontSize:12, color:C.secondary, margin:"0 0 6px" }}>
                {trader.company_name} · {trader.trade_type} · {trader.postcode}
              </p>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                {reviews.length > 0
                  ? <OverallScore score={overallAvg} />
                  : <span style={{ fontSize:12, color:C.secondary }}>No verified reviews yet</span>}
                {reviews.length > 0 && (
                  <span style={{ fontSize:12, color:C.secondary }}>from {reviews.length} verified job{reviews.length === 1 ? "" : "s"}</span>
                )}
                {trader.verified && (
                  <span style={{ fontSize:11, background:C.tealLight, color:"#0F766E", border:`1px solid #99F6E4`, borderRadius:20, padding:"2px 8px", fontWeight:600 }}>
                    ✅ ProGrafter Vetted
                  </span>
                )}
              </div>
            </div>
          </div>

          {reviews.length > 0 && (
            <>
              <p style={{ fontSize:10, fontWeight:700, color:C.teal, letterSpacing:"0.1em", textTransform:"uppercase", margin:"0 0 10px" }}>
                Average scores across all jobs
              </p>
              {TRADER_DIMENSIONS.map(d => {
                const score = dimAvgs[d.id];
                if (score == null) return null;
                return (
                  <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                    <span style={{ fontSize:12, color:C.secondary, width:140, flexShrink:0 }}>{d.label}</span>
                    <div style={{ flex:1, height:6, borderRadius:3, background:"#E5E1D8", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:3, background: score>=4.5 ? C.green : score>=3.5 ? C.teal : C.amber, width:`${(score/5)*100}%`, transition:"width 0.5s ease" }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:C.navy, width:28, textAlign:"right" }}>{score.toFixed(1)}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {reviews.length > 0 ? (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <p style={{ fontSize:14, fontWeight:700, color:C.deep, margin:0 }}>
                All reviews ({reviews.length})
              </p>
              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.secondary, cursor:"pointer" }}>
                <input type="checkbox" checked={showTraderReviews} onChange={e => setShowTraderReviews(e.target.checked)} style={{ accentColor:C.teal }} />
                Show trader's homeowner reviews
              </label>
            </div>
            {reviews.map(r => <ReviewCard key={r.id} review={r} showTraderView={showTraderReviews} />)}
          </>
        ) : (
          <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:12, padding:"2rem", textAlign:"center", color:C.secondary, fontSize:13 }}>
            No published reviews yet. Reviews appear here once both parties on a completed job have submitted theirs.
          </div>
        )}

        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", marginTop:16, display:"flex", alignItems:"flex-start", gap:8 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🔒</span>
          <p style={{ fontSize:11, color:C.secondary, margin:0, lineHeight:1.6 }}>
            All ProGrafter reviews are verified against a completed job record. No anonymous reviews. No reviews without a real job. Neither the trader nor the homeowner can remove a legitimate review.
          </p>
        </div>
      </div>
    </div>
  );
}
