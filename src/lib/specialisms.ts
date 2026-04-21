import { supabase } from "@/integrations/supabase/client";

export interface Specialism {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  applicable_trades: string[];
  sort_order: number;
  is_active: boolean;
}

export interface TradeSpecialismRow {
  trade_id: string;
  specialism_id: string;
  is_primary: boolean;
}

/** Fetch all active specialisms ordered by sort_order. */
export async function fetchSpecialisms(): Promise<Specialism[]> {
  const { data, error } = await supabase
    .from("specialisms" as any)
    .select("id, slug, name, description, icon, applicable_trades, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as unknown as Specialism[]) || [];
}

/** Filter specialisms applicable to a given primary trade type label. */
export function specialismsForTrade(all: Specialism[], tradeType: string): Specialism[] {
  if (!tradeType) return all;
  return all.filter((s) => s.applicable_trades.includes(tradeType));
}

/** Fetch a tradesperson's selected specialisms. */
export async function fetchTradeSpecialisms(tradeId: string): Promise<TradeSpecialismRow[]> {
  const { data, error } = await supabase
    .from("trade_specialisms" as any)
    .select("trade_id, specialism_id, is_primary")
    .eq("trade_id", tradeId);
  if (error) throw error;
  return (data as unknown as TradeSpecialismRow[]) || [];
}

/**
 * Replace the trade's specialism selection.
 * `selected` = list of specialism IDs they want. `primaryId` = the one they
 * flagged as their main specialism (or null).
 */
export async function saveTradeSpecialisms(
  tradeId: string,
  selected: string[],
  primaryId: string | null,
): Promise<void> {
  // Wipe existing selections then re-insert. Tiny dataset (max ~8 rows) so
  // simplicity beats diffing.
  const { error: delErr } = await supabase
    .from("trade_specialisms" as any)
    .delete()
    .eq("trade_id", tradeId);
  if (delErr) throw delErr;

  if (selected.length === 0) return;

  const rows = selected.map((id) => ({
    trade_id: tradeId,
    specialism_id: id,
    is_primary: id === primaryId,
  }));
  const { error: insErr } = await supabase.from("trade_specialisms" as any).insert(rows);
  if (insErr) throw insErr;
}
