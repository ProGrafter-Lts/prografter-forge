import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TradeNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  job_id: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Live in-app notifications for the signed-in trade.
 * Backed by trade_notifications (RLS-scoped to the user).
 */
export const useTradeNotifications = () => {
  const [items, setItems] = useState<TradeNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("trade_notifications")
      .select("id, type, title, body, link, job_id, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as TradeNotification[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("trade-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trade_notifications" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    await supabase
      .from("trade_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!unread.length) return;
    const stamp = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: stamp })));
    await supabase.from("trade_notifications").update({ read_at: stamp }).in("id", unread);
  }, [items]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  return { items, loading, unreadCount, refresh, markRead, markAllRead };
};
