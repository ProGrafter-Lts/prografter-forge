import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";

interface TradeAccessState {
  isReady: boolean;
  loading: boolean;
  trade: { id: string; trade_type: string } | null;
  error: string | null;
}

export function useTradeAccess(options?: { redirectToSetup?: boolean }): TradeAccessState {
  const navigate = useNavigate();
  const { isReady: authReady, user } = useAuthReady();
  const [state, setState] = useState<TradeAccessState>({
    isReady: false,
    loading: true,
    trade: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!authReady) {
      setState((current) => ({ ...current, isReady: false, loading: true, error: null }));
      return;
    }

    if (!user) {
      setState({ isReady: true, loading: false, trade: null, error: null });
      return;
    }

    setState((current) => ({ ...current, isReady: true, loading: true, error: null }));

    const loadTrade = async () => {
      try {
        const result = await supabase
          .from("trades")
          .select("id, trade_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (result.error) {
          setState({
            isReady: true,
            loading: false,
            trade: null,
            error: result.error.message ?? "Couldn't load your trade profile.",
          });
          return;
        }

        if (!result.data) {
          setState({ isReady: true, loading: false, trade: null, error: null });
          if (options?.redirectToSetup) {
            navigate("/register/trade", { replace: true });
          }
          return;
        }

        setState({ isReady: true, loading: false, trade: result.data, error: null });
      } catch (error) {
        if (cancelled) return;

        setState({
          isReady: true,
          loading: false,
          trade: null,
          error: error instanceof Error ? error.message : "Couldn't load your trade profile.",
        });
      }
    };

    void loadTrade();

    return () => {
      cancelled = true;
    };
  }, [authReady, navigate, options?.redirectToSetup, user?.id]);

  return state;
}