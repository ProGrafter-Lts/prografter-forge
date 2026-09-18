/**
 * Printed letter + envelope surfaces, ported from the standalone ProGrafter
 * Batch Letter Printer. The CSS below IS the letter design — do not restyle.
 *
 * Preview and print both render the HTML produced by buildLetterHtml(), so
 * they can never drift apart.
 */

import { useEffect } from "react";

export const LETTER_PRINT_CSS = `
.pg-sheet { display: none; }

.envSheet {
  position: relative; width: var(--env-w); height: var(--env-h);
  page-break-after: always; page-break-inside: avoid;
  overflow: hidden; background: #fff;
}
.envSheet:last-child { page-break-after: auto; }
.envSheet .rec {
  position: absolute; top: var(--addr-top); left: var(--addr-left);
  font-size: var(--addr-size); line-height: 1.4; color: #000;
  white-space: pre-line; font-weight: 500; font-family: Arial, Helvetica, sans-serif;
}

.letterPage {
  width: 210mm; height: 297mm;
  page-break-after: always; page-break-inside: avoid;
  padding: 18mm 22mm 16mm 22mm;
  font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; line-height: 1.32;
  color: #000; background: #fff;
  box-sizing: border-box; position: relative;
}
.letterPage:last-child { page-break-after: auto; }
.letterPage * { box-sizing: border-box; }
.letterPage table.headerTbl { width: 100%; border-collapse: collapse; margin-bottom: 6pt; table-layout: fixed; }
.letterPage table.headerTbl td { vertical-align: top; padding: 0; border: none; }
.letterPage table.headerTbl td.logoCell { width: 55mm; }
.letterPage table.headerTbl td.senderCell { text-align: right; font-size: 10.5pt; line-height: 1.4; }
.letterPage table.headerTbl img.logo {
  width: 48mm; height: auto; display: block; margin: 1mm 0 2mm 0;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.letterPage table.headerTbl .senderCell div { margin: 0; padding: 0; }
.letterPage .recipient { margin-top: 2pt; margin-bottom: 10pt; line-height: 1.4; }
.letterPage .recipient div { margin: 0; padding: 0; }
.letterPage .recipient .recName { font-weight: bold; }
.letterPage .date { margin-bottom: 10pt; }
.letterPage .body { margin-bottom: 0; }
.letterPage .body p { margin: 0 0 8pt 0; text-align: left; line-height: 1.38; }
.letterPage .sign { margin-top: 10pt; line-height: 1.4; }
.letterPage .sign div { margin: 0; padding: 0; }
.letterPage .sign .footer { font-size: 8.5pt; color: #222; margin-top: 2pt; }
.letterPage .ps { margin-top: 12pt; font-style: italic; font-size: 9.5pt; line-height: 1.4; color: #222; }

/* Inline preview */
.pg-preview-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(15,34,56,.75); padding: 30px; overflow: auto; }
.pg-preview-inner { max-width: 230mm; margin: 0 auto; background: #fff; box-shadow: 0 30px 80px -20px rgba(0,0,0,.5); border-radius: 6px; }
.pg-preview-bar { position: sticky; top: 0; background: #0F2238; color: #fff; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 6px 6px 0 0; font-size: 14px; font-weight: 600; z-index: 2; }
.pg-preview-bar button { background: #fff; color: #0F2238; border: none; border-radius: 6px; padding: 6px 14px; font-weight: 600; cursor: pointer; font-size: 13px; }
.pg-preview-overlay .letterPage { box-shadow: none; margin: 0 auto; height: auto; min-height: 297mm; display: block; }

@media print {
  body { background: #fff; padding: 0; margin: 0; }
  body * { visibility: hidden !important; }
  body.pg-mode-env .pg-envelope-sheet, body.pg-mode-env .pg-envelope-sheet * { visibility: visible !important; }
  body.pg-mode-letter .pg-letter-sheet, body.pg-mode-letter .pg-letter-sheet * { visibility: visible !important; }
  body.pg-mode-env .pg-envelope-sheet, body.pg-mode-letter .pg-letter-sheet {
    display: block !important; position: absolute; left: 0; top: 0; margin: 0;
  }
}
`;

/** Hidden print surfaces. `html` is pre-composed by the engine. */
export const PrintSurfaces = ({
  envelopeHtml,
  letterHtml,
  envVars,
}: {
  envelopeHtml: string;
  letterHtml: string;
  envVars: React.CSSProperties;
}) => (
  <>
    <div className="pg-sheet pg-envelope-sheet" style={envVars} dangerouslySetInnerHTML={{ __html: envelopeHtml }} />
    <div className="pg-sheet pg-letter-sheet" dangerouslySetInnerHTML={{ __html: letterHtml }} />
  </>
);

export const LetterPreview = ({ html, onClose }: { html: string; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="pg-preview-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pg-preview-inner">
        <div className="pg-preview-bar">
          <span>Letter preview — exactly what will print</span>
          <button onClick={onClose}>Close</button>
        </div>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
};

/** Swap the @page rule between envelope size and A4 immediately before printing. */
export const setPageRule = (rule: string) => {
  let el = document.getElementById("pg-page-rule") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "pg-page-rule";
    document.head.appendChild(el);
  }
  el.textContent = rule;
};
