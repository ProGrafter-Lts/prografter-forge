import { useMemo, useState } from "react";
import { X, Download, Printer, Save, Pencil, Eye, Check } from "lucide-react";
import jsPDF from "jspdf";
import { HubButton } from "@/hub/components/ui";
import type { Opportunity } from "@/hub/data/opportunities";
import { getBusinessProfile } from "@/hub/data/business";
import {
  composeLetterBody,
  letterGreeting,
  fullLetterText,
  saveTemplate,
  saveLetter,
} from "@/hub/data/letters";
import { toast } from "@/hooks/use-toast";

interface Props {
  opportunity: Opportunity;
  onClose: () => void;
  onSaved?: () => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const LetterGenerator = ({ opportunity: o, onClose, onSaved }: Props) => {
  const biz = useMemo(() => getBusinessProfile(), []);
  const greeting = useMemo(() => letterGreeting(o), [o]);
  const [body, setBody] = useState(() => composeLetterBody(o, biz));
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [savedTick, setSavedTick] = useState(false);

  const persist = () => {
    saveLetter({ opportunityId: o.id, greeting, body });
    onSaved?.();
  };

  const handleDownload = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    const write = (text: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      doc.setFontSize(opts.size ?? 11);
      const lines = doc.splitTextToSize(text, width);
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += (opts.size ?? 11) * 1.4;
      });
      y += opts.gap ?? 0;
    };

    write(biz.businessName, { size: 15, bold: true });
    write(biz.serviceArea, { size: 10 });
    write(`${biz.phone}  ·  ${biz.email}`, { size: 10 });
    if (biz.website) write(biz.website, { size: 10, gap: 12 });
    write(fmtDate(new Date().toISOString()), { gap: 12 });
    write(`${o.address},`);
    write(o.postcode, { gap: 12 });
    write(greeting, { gap: 10 });
    body.split("\n\n").forEach((para) => write(para, { gap: 10 }));
    write("Kind regards,", { gap: 20 });
    write(biz.contactName, { bold: true });
    write(biz.businessName);
    if (biz.registrationNo) write(biz.registrationNo, { size: 9 });

    doc.save(`Introduction Letter - ${o.address.split(",")[0]}.pdf`);
    persist();
    toast({ title: "PDF downloaded", description: "Saved to the opportunity timeline." });
  };

  const handlePrint = () => {
    const html = `
      <html><head><title>Introduction Letter</title>
      <style>
        body{font-family:Georgia,'Times New Roman',serif;color:#1a2333;line-height:1.6;max-width:640px;margin:48px auto;padding:0 24px;}
        .head{font-weight:700;font-size:18px;} .meta{font-size:13px;color:#556;}
        .sp{margin-top:20px;} p{margin:0 0 14px;white-space:pre-wrap;}
      </style></head><body>
        <div class="head">${biz.businessName}</div>
        <div class="meta">${biz.serviceArea}<br/>${biz.phone} · ${biz.email}${biz.website ? "<br/>" + biz.website : ""}</div>
        <div class="sp">${fmtDate(new Date().toISOString())}</div>
        <div class="sp">${o.address},<br/>${o.postcode}</div>
        <div class="sp">${greeting}</div>
        <div class="sp">${body.split("\n\n").map((p) => `<p>${p}</p>`).join("")}</div>
        <div class="sp">Kind regards,</div>
        <div style="margin-top:28px;font-weight:700;">${biz.contactName}</div>
        <div>${biz.businessName}</div>
        <div class="meta">${biz.registrationNo ?? ""}</div>
      </body></html>`;
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) {
      toast({ title: "Pop-up blocked", description: "Allow pop-ups to print." });
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    persist();
  };

  const handleSaveTemplate = () => {
    saveTemplate(body);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1800);
    toast({ title: "Template saved", description: "This wording will be reused for future letters." });
  };

  return (
    <div className="hub-letter-overlay" onClick={onClose}>
      <div className="hub-letter-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="hub-letter-head">
          <div>
            <h2 className="hub-letter-title">Introduction Letter</h2>
            <p className="hub-letter-sub">{o.address}</p>
          </div>
          <div className="hub-letter-toggle">
            <button
              className={mode === "preview" ? "is-active" : ""}
              onClick={() => setMode("preview")}
            >
              <Eye size={14} /> Preview
            </button>
            <button className={mode === "edit" ? "is-active" : ""} onClick={() => setMode("edit")}>
              <Pencil size={14} /> Edit
            </button>
          </div>
          <button className="hub-letter-close" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="hub-letter-scroll">
          {mode === "preview" ? (
            <div className="hub-letter-page">
              <div className="hub-letter-brand">{biz.businessName}</div>
              <div className="hub-letter-meta">
                {biz.serviceArea}
                <br />
                {biz.phone} · {biz.email}
                {biz.website ? (
                  <>
                    <br />
                    {biz.website}
                  </>
                ) : null}
              </div>
              <div className="hub-letter-meta" style={{ marginTop: 18 }}>
                {fmtDate(new Date().toISOString())}
              </div>
              <div className="hub-letter-meta" style={{ marginTop: 18 }}>
                {o.address},
                <br />
                {o.postcode}
              </div>
              <p style={{ marginTop: 18, fontWeight: 600 }}>{greeting}</p>
              {body.split("\n\n").map((p, i) => (
                <p key={i} className="hub-letter-para">
                  {p}
                </p>
              ))}
              <p style={{ marginTop: 18 }}>Kind regards,</p>
              <p style={{ marginTop: 20, fontWeight: 700 }}>{biz.contactName}</p>
              <p>{biz.businessName}</p>
              {biz.registrationNo ? (
                <p className="hub-letter-meta">{biz.registrationNo}</p>
              ) : null}
            </div>
          ) : (
            <div className="hub-letter-edit">
              <label className="hub-letter-label">Greeting</label>
              <input className="hub-letter-input" value={greeting} readOnly />
              <label className="hub-letter-label" style={{ marginTop: 14 }}>
                Letter body
              </label>
              <textarea
                className="hub-letter-textarea"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={16}
              />
              <p className="hub-letter-hint">
                Separate paragraphs with a blank line. Company details and sign-off are added
                automatically.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="hub-letter-actions">
          <HubButton variant="secondary" icon={savedTick ? <Check size={16} /> : <Save size={16} />} onClick={handleSaveTemplate}>
            {savedTick ? "Saved" : "Save Template"}
          </HubButton>
          <div className="hub-letter-actions-main">
            <HubButton variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
              Print
            </HubButton>
            <HubButton variant="accent" icon={<Download size={16} />} onClick={handleDownload}>
              Download PDF
            </HubButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterGenerator;
