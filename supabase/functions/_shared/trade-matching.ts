// Shared trade-matching + ranking logic used by both the admin match preview
// (`match-trades-for-brief`) and the publish flow (`publish-job-brief`,
// `release-next-batch`) so ranking is identical everywhere.
//
// Matching doctrine: ProGrafter never broadcasts. A job is shared with a small,
// ranked shortlist of suitable verified trades, released in controlled batches.

// Map homeowner-brief trade category slugs to trade_type labels used on trades.
export const CATEGORY_TRADE_TYPES: Record<string, string[]> = {
  electrician: ['Electrician'],
  gas_engineer: ['Gas Engineer', 'Plumber'],
  plumber: ['Plumber'],
  general_builder: ['Builder', 'General Builder'],
  plasterer: ['Plasterer', 'Builder'],
  carpenter: ['Carpenter', 'Joiner'],
  tiler: ['Tiler'],
  decorator: ['Decorator', 'Painter'],
  roofer: ['Roofer'],
  landscaper: ['Landscaper'],
}

export interface TradeCandidate {
  id: string
  name: string | null
  company_name: string | null
  postcode: string | null
  user_id: string | null
  service_radius_miles: number | null
  trade_type: string | null
  verified: boolean | null
  accepting_jobs: boolean | null
  avg_rating: number | null
  review_count: number | null
}

export interface RankedTrade extends TradeCandidate {
  distance_miles: number
  rank: number
}

function toRad(d: number) {
  return (d * Math.PI) / 180
}

export function milesBetween(a: [number, number], b: [number, number]): number {
  const R = 3958.8
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const pcKey = (p: string) => p.toUpperCase().replace(/\s+/g, '')

export async function geocode(postcodes: string[]): Promise<Record<string, [number, number]>> {
  const out: Record<string, [number, number]> = {}
  const cleaned = [...new Set(postcodes.map((p) => p.trim()).filter(Boolean))]
  for (let i = 0; i < cleaned.length; i += 100) {
    const chunk = cleaned.slice(i, i + 100)
    try {
      const res = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: chunk }),
      })
      const json = await res.json()
      for (const r of json.result || []) {
        if (r.result?.latitude != null) {
          out[pcKey(r.query)] = [r.result.latitude, r.result.longitude]
        }
      }
    } catch (e) {
      console.error('[trade-matching] geocode chunk failed', e)
    }
  }
  return out
}

/**
 * Rank candidate trades for a brief. Simple, explainable ranking:
 *   1. verified + accepting only (filtered by caller query)
 *   2. matching trade category (filtered by caller query)
 *   3. within the trade's service radius of the job
 *   4. closest first, then higher rating as a tiebreak
 * Returns the full ranked shortlist (caller decides batch size / cap of 3).
 */
export async function rankTrades(
  candidates: TradeCandidate[],
  briefPostcode: string,
): Promise<RankedTrade[]> {
  const briefGeo = briefPostcode ? await geocode([briefPostcode]) : {}
  const briefPoint = briefGeo[pcKey(briefPostcode || '')]
  if (!briefPoint) return []

  const tradePostcodes = candidates.map((t) => t.postcode || '').filter(Boolean)
  const tradeGeo = await geocode(tradePostcodes)

  const scored: { trade: TradeCandidate; dist: number }[] = []
  for (const t of candidates) {
    if (!t.postcode) continue
    const pt = tradeGeo[pcKey(t.postcode)]
    if (!pt) continue
    const dist = milesBetween(briefPoint, pt)
    if (dist <= (t.service_radius_miles ?? 25)) scored.push({ trade: t, dist })
  }

  scored.sort((a, b) => {
    if (Math.abs(a.dist - b.dist) > 0.5) return a.dist - b.dist
    return (b.trade.avg_rating ?? 0) - (a.trade.avg_rating ?? 0)
  })

  return scored.map((s, i) => ({ ...s.trade, distance_miles: Math.round(s.dist * 10) / 10, rank: i + 1 }))
}
