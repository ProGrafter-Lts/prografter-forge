import { useState } from "react";
import { Bell, Mail, MapPin } from "lucide-react";
import { HubCard } from "@/hub/components/ui";

interface Pref {
  key: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

const PREFS: Pref[] = [
  { key: "newWork", icon: <MapPin size={18} />, title: "New work nearby", desc: "Alert me when planning applications match my trade and area." },
  { key: "followUps", icon: <Bell size={18} />, title: "Follow-up reminders", desc: "Remind me when a pipeline follow-up is due." },
  { key: "emailDigest", icon: <Mail size={18} />, title: "Weekly email digest", desc: "A Monday summary of new opportunities and outstanding quotes." },
];

const STORAGE_KEY = "pg-hub-settings";

const load = (): Record<string, boolean> => {
  if (typeof window === "undefined") return { newWork: true, followUps: true, emailDigest: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { newWork: true, followUps: true, emailDigest: false };
  } catch {
    return { newWork: true, followUps: true, emailDigest: false };
  }
};

const HubSettings = () => {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => load());

  const toggle = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <>
      <div>
        <h1 className="hub-page-title">Settings</h1>
        <p className="hub-page-sub">Choose what you want to be told about, and when.</p>
      </div>

      <div style={{ maxWidth: 620, marginTop: 28 }}>
        <HubCard>
          <h2 className="hub-section-title" style={{ marginBottom: 4 }}>
            Notifications
          </h2>
          <div style={{ display: "grid", gap: 4, marginTop: 12 }}>
            {PREFS.map((p, i) => (
              <div
                key={p.key}
                className="flex items-center gap-3"
                style={{
                  padding: "16px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--hub-line)",
                }}
              >
                <span style={{ color: "#45536b", flexShrink: 0 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "var(--hub-ink)" }}>{p.title}</div>
                  <div style={{ color: "#8a97a8", fontSize: 13, marginTop: 2 }}>{p.desc}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={prefs[p.key]}
                  aria-label={p.title}
                  onClick={() => toggle(p.key)}
                  style={{
                    width: 46,
                    height: 28,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    padding: 3,
                    background: prefs[p.key] ? "var(--hub-teal, #0f766e)" : "#cdd5e0",
                    transition: "background 0.18s ease",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transform: prefs[p.key] ? "translateX(18px)" : "translateX(0)",
                      transition: "transform 0.18s ease",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </HubCard>
      </div>
    </>
  );
};

export default HubSettings;
