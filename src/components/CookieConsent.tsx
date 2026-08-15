import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "pg_cookie_consent_v1";

export type CookiePrefs = {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

const DEFAULT_PREFS: CookiePrefs = { functional: true, analytics: true, marketing: false };

export function getStoredCookiePrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { prefs?: CookiePrefs };
    return parsed?.prefs ?? null;
  } catch {
    return null;
  }
}

const CATEGORIES: { key: keyof CookiePrefs; label: string; desc: string }[] = [
  {
    key: "functional",
    label: "Functional",
    desc: "Remembers your preferences and keeps saved progress on tools like the Quote Checker.",
  },
  {
    key: "analytics",
    label: "Analytics",
    desc: "Anonymous usage stats so we can see which parts of ProGrafter actually help.",
  },
  {
    key: "marketing",
    label: "Marketing",
    desc: "Advertising and retargeting cookies. We don't currently use any — off by default.",
  },
];

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (!getStoredCookiePrefs()) setVisible(true);
  }, []);

  const persist = useCallback(async (chosen: CookiePrefs) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prefs: chosen, decided_at: new Date().toISOString() }),
      );
    } catch {
      /* storage unavailable — decision still applies for this session */
    }
    setVisible(false);
    setManaging(false);

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id ?? null;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : null;
      const rows = [
        { consent_type: "cookie_strictly_necessary", consented: true },
        { consent_type: "cookie_functional", consented: chosen.functional },
        { consent_type: "cookie_analytics", consented: chosen.analytics },
        { consent_type: "cookie_marketing", consented: chosen.marketing },
      ].map((r) => ({ ...r, user_id: userId, user_agent: userAgent }));
      await supabase.from("consents_log").insert(rows);
    } catch {
      /* logging must never block the user */
    }
  }, []);

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
        <div className="mx-auto max-w-4xl rounded-2xl border border-cream/10 bg-deep p-5 shadow-2xl">
          <div className="flex flex-col gap-4 craft:flex-row craft:items-center craft:justify-between">
            <p className="font-body text-sm text-cream/90">
              We use cookies to make ProGrafter work. Read our{" "}
              <Link to="/cookies" className="text-teal underline underline-offset-2">
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setManaging(true)}
                className="rounded-xl border border-cream/25 px-5 py-2.5 font-mono text-sm text-cream hover:border-teal hover:text-teal transition-colors"
              >
                Manage preferences
              </button>
              <button
                onClick={() => persist({ functional: true, analytics: true, marketing: false })}
                className="rounded-xl bg-teal px-5 py-2.5 font-mono text-sm text-cream hover:bg-teal-hover transition-colors"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={managing} onOpenChange={setManaging}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">Cookie preferences</DialogTitle>
            <DialogDescription className="font-body">
              Choose what ProGrafter may store on your device. You can change this at any time from
              the footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-navy/10 bg-muted/40 p-4">
              <div>
                <p className="font-mono text-sm text-navy">Strictly necessary</p>
                <p className="font-body text-xs text-secondary-text mt-1">
                  Required for sign-in, security and core functionality. Always on.
                </p>
              </div>
              <Switch checked disabled aria-label="Strictly necessary cookies (always on)" />
            </div>

            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                className="flex items-start justify-between gap-4 rounded-xl border border-navy/10 p-4"
              >
                <div>
                  <p className="font-mono text-sm text-navy">{c.label}</p>
                  <p className="font-body text-xs text-secondary-text mt-1">{c.desc}</p>
                </div>
                <Switch
                  checked={prefs[c.key]}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [c.key]: v }))}
                  aria-label={`${c.label} cookies`}
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => persist({ functional: false, analytics: false, marketing: false })}
              className="rounded-xl border border-navy/20 px-5 py-2.5 font-mono text-sm text-navy hover:border-teal hover:text-teal transition-colors"
            >
              Reject all
            </button>
            <button
              onClick={() => persist(prefs)}
              className="rounded-xl bg-teal px-5 py-2.5 font-mono text-sm text-cream hover:bg-teal-hover transition-colors"
            >
              Save preferences
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
