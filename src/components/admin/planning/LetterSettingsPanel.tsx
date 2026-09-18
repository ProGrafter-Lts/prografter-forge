/**
 * Editable letter text + envelope settings for the Planning Pipeline batch
 * printer. TEXT AND ENVELOPE GEOMETRY ONLY — the letter layout itself is fixed
 * in LetterSheet.tsx and must never be altered from here.
 */

import { useEffect, useState } from "react";
import { C } from "@/pages/planningPipelineModel";
import {
  ENVELOPE_SIZES,
  type EnvelopeSettings,
  type LetterTemplates,
} from "@/lib/planningLetterEngine";

const field: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.line}`,
  background: "rgba(255,255,255,0.05)",
  color: C.cream,
  fontSize: 13.5,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const label: React.CSSProperties = { fontSize: 12.5, color: C.faint, display: "grid", gap: 5 };

export const LetterSettingsPanel = ({
  templates,
  envelope,
  saving,
  onSave,
}: {
  templates: LetterTemplates;
  envelope: EnvelopeSettings;
  saving: boolean;
  onSave: (next: { templates?: LetterTemplates; envelope?: EnvelopeSettings }) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState(templates);
  const [e, setE] = useState(envelope);

  useEffect(() => setT(templates), [templates]);
  useEffect(() => setE(envelope), [envelope]);

  const btn = (primary = false): React.CSSProperties => ({
    padding: "9px 16px",
    borderRadius: 8,
    border: `1px solid ${primary ? C.teal : C.line}`,
    background: primary ? C.teal : "transparent",
    color: C.cream,
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <div style={{ marginTop: 22, border: `1px solid ${C.line}`, borderRadius: 12, background: "rgba(0,0,0,0.14)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ ...btn(), width: "100%", textAlign: "left", border: "none", background: "transparent", padding: "14px 16px" }}
      >
        {open ? "▾" : "▸"} Templates, sender block, sign-off, P.S. & envelope settings
      </button>

      {open && (
        <div style={{ padding: "0 16px 18px", display: "grid", gap: 16 }}>
          {(["A", "B", "C"] as const).map((k) => (
            <div key={k} style={{ display: "grid", gap: 6 }}>
              <label style={label}>
                Template {k} — name
                <input
                  value={t[k].name}
                  onChange={(ev) => setT({ ...t, [k]: { ...t[k], name: ev.target.value } })}
                  style={field}
                />
              </label>
              <label style={label}>
                Template {k} — body (placeholders: {"{{name}} {{address}} {{ref}} {{type}} {{date}}"}, **bold**, *italic*)
                <textarea
                  value={t[k].body}
                  onChange={(ev) => setT({ ...t, [k]: { ...t[k], body: ev.target.value } })}
                  rows={k === "A" ? 14 : 8}
                  style={{ ...field, lineHeight: 1.5, resize: "vertical" }}
                />
              </label>
            </div>
          ))}

          <label style={label}>
            Sender block (top right)
            <textarea value={t.sender} onChange={(ev) => setT({ ...t, sender: ev.target.value })} rows={5} style={{ ...field, resize: "vertical" }} />
          </label>
          <label style={label}>
            Sign-off ([FOOTER] prefix makes a line small print)
            <textarea value={t.signOff} onChange={(ev) => setT({ ...t, signOff: ev.target.value })} rows={5} style={{ ...field, resize: "vertical" }} />
          </label>
          <label style={label}>
            P.S. (italic, smaller)
            <textarea value={t.ps} onChange={(ev) => setT({ ...t, ps: ev.target.value })} rows={3} style={{ ...field, resize: "vertical" }} />
          </label>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
            <label style={label}>
              Envelope size
              <select value={e.size} onChange={(ev) => setE({ ...e, size: ev.target.value })} style={field}>
                {ENVELOPE_SIZES.map((s) => (
                  <option key={s.id} value={s.id} style={{ color: "#000" }}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={label}>
              Address from top (mm)
              <input type="number" value={e.addrTop} onChange={(ev) => setE({ ...e, addrTop: Number(ev.target.value) })} style={field} />
            </label>
            <label style={label}>
              Address from left (mm)
              <input type="number" value={e.addrLeft} onChange={(ev) => setE({ ...e, addrLeft: Number(ev.target.value) })} style={field} />
            </label>
            <label style={label}>
              Address font size (pt)
              <input type="number" value={e.addrSize} onChange={(ev) => setE({ ...e, addrSize: Number(ev.target.value) })} style={field} />
            </label>
          </div>

          <div>
            <button onClick={() => onSave({ templates: t, envelope: e })} disabled={saving} style={btn(true)}>
              {saving ? "Saving…" : "Save letter settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
