import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_ENVELOPE,
  DEFAULT_TEMPLATES,
  type EnvelopeSettings,
  type LetterTemplates,
} from "@/lib/planningLetterEngine";

/**
 * Letter templates, sender block, sign-off, P.S. and envelope settings for the
 * Planning Pipeline batch printer. Stored in the database (not localStorage)
 * so the batch workflow survives refreshes and works on any device.
 */
export function usePlanningLetterSettings() {
  const [templates, setTemplates] = useState<LetterTemplates>(DEFAULT_TEMPLATES);
  const [envelope, setEnvelope] = useState<EnvelopeSettings>(DEFAULT_ENVELOPE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("planning_letter_settings")
        .select("templates, envelope")
        .eq("id", "default")
        .maybeSingle();
      if (cancelled) return;
      const t = (data?.templates ?? {}) as Partial<LetterTemplates>;
      const e = (data?.envelope ?? {}) as Partial<EnvelopeSettings>;
      setTemplates({
        A: t.A ?? DEFAULT_TEMPLATES.A,
        B: t.B ?? DEFAULT_TEMPLATES.B,
        C: t.C ?? DEFAULT_TEMPLATES.C,
        sender: t.sender ?? DEFAULT_TEMPLATES.sender,
        signOff: t.signOff ?? DEFAULT_TEMPLATES.signOff,
        ps: t.ps ?? DEFAULT_TEMPLATES.ps,
      });
      setEnvelope({ ...DEFAULT_ENVELOPE, ...e });
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(
    async (next: { templates?: LetterTemplates; envelope?: EnvelopeSettings }) => {
      setSaving(true);
      const payload = {
        id: "default",
        templates: (next.templates ?? templates) as never,
        envelope: (next.envelope ?? envelope) as never,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("planning_letter_settings").upsert(payload, { onConflict: "id" });
      setSaving(false);
      if (!error) {
        if (next.templates) setTemplates(next.templates);
        if (next.envelope) setEnvelope(next.envelope);
      }
      return error?.message ?? null;
    },
    [templates, envelope],
  );

  return { templates, envelope, setTemplates, setEnvelope, save, loaded, saving };
}
