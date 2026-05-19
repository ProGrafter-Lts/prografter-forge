import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VerificationStatus {
  loading: boolean;
  completed: number;
  total: number;
  verified: boolean;
}

const TOTAL_CHECKS = 5;

/**
 * Computes the trade's 5-point verification progress:
 *   1. ID document uploaded
 *   2. Insurance (PL insurer recorded OR insurance doc uploaded)
 *   3. Qualification (any trade cert OR qualification doc uploaded)
 *   4. Companies House number recorded
 *   5. Admin reference check complete (verification_status = 'approved')
 */
export const useVerificationStatus = (): VerificationStatus => {
  const [state, setState] = useState<VerificationStatus>({
    loading: true,
    completed: 0,
    total: TOTAL_CHECKS,
    verified: false,
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
        return;
      }

      const { data: trade } = await supabase
        .from("trades")
        .select(
          "id, verification_status, public_liability_insurer, companies_house_number, gas_safe_number, mcs_number, trustmark_number, cps_registration_number, pas_2030_accredited, fgas_registered, ozev_approved, ciga_registered, inca_certified"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (!trade) {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
        return;
      }

      const { data: docs } = await supabase
        .from("trade_verification_documents")
        .select("doc_type")
        .eq("trade_id", trade.id);

      const docTypes = new Set((docs ?? []).map((d) => d.doc_type));

      const hasInsuranceField = !!trade.public_liability_insurer;
      const hasQualField =
        !!trade.gas_safe_number ||
        !!trade.mcs_number ||
        !!trade.trustmark_number ||
        !!trade.cps_registration_number ||
        trade.pas_2030_accredited ||
        trade.fgas_registered ||
        trade.ozev_approved ||
        trade.ciga_registered ||
        trade.inca_certified;

      const checks = [
        docTypes.has("id"),
        docTypes.has("insurance") || hasInsuranceField,
        docTypes.has("qualification") || hasQualField,
        !!trade.companies_house_number,
        trade.verification_status === "approved",
      ];

      const completed = checks.filter(Boolean).length;
      const verified = trade.verification_status === "approved";

      if (!cancelled) {
        setState({ loading: false, completed, total: TOTAL_CHECKS, verified });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
