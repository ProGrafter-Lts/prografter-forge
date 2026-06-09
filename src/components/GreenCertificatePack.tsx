import { useState } from "react";
import { Leaf, Upload, Download, CheckCircle2, FileText, Thermometer, Sun, Wind, Home } from "lucide-react";
import { isGreenTrade, RENEWABLE_TRADE_TYPES } from "@/lib/greenTrades";

const EPC_BANDS = ["A", "B", "C", "D", "E", "F", "G"];

interface GreenCertPackProps {
  jobType: string;
  isComplete?: boolean;
}

/* ── helpers ── */
const isSolar = (t: string) => t.toLowerCase().includes("solar");
const isHeatPump = (t: string) => t.toLowerCase().includes("heat pump");
const isInsulation = (t: string) =>
  ["insulation", "ewi", "draught"].some((k) => t.toLowerCase().includes(k));

const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-card rounded-2xl border border-green-200 shadow-sm overflow-hidden">
    <div className="bg-green-50 px-5 py-3 border-b border-green-100 flex items-center gap-2">
      <Icon className="w-4 h-4 text-green-600" />
      <h3 className="font-heading text-navy text-lg">{title}</h3>
      <Leaf className="w-3.5 h-3.5 text-green-500 ml-auto" />
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, placeholder, type = "text", value, onChange }: { label: string; placeholder?: string; type?: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="font-mono text-[10px] text-secondary-text uppercase tracking-wider block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm text-body-text focus:outline-none focus:ring-2 focus:ring-green-400/30"
    />
  </div>
);

const Select = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="font-mono text-[10px] text-secondary-text uppercase tracking-wider block mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-navy/10 rounded-xl px-4 py-2.5 font-mono text-sm text-body-text bg-white focus:outline-none focus:ring-2 focus:ring-green-400/30"
    >
      <option value="">Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const FileUpload = ({ label }: { label: string }) => (
  <div>
    <label className="font-mono text-[10px] text-secondary-text uppercase tracking-wider block mb-1">{label}</label>
    <div className="border-2 border-dashed border-navy/10 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:border-green-400/50 transition-colors">
      <Upload className="w-4 h-4 text-secondary-text" />
      <span className="font-mono text-xs text-secondary-text">Upload PDF</span>
    </div>
  </div>
);

/* ── maintenance schedules ── */
const MAINTENANCE: Record<string, { task: string; frequency: string }[]> = {
  solar: [
    { task: "Panel clean & visual inspection", frequency: "Annually" },
    { task: "Inverter performance check", frequency: "Every 5 years" },
    { task: "String/junction box check", frequency: "Annually" },
    { task: "DC isolator test", frequency: "Annually" },
  ],
  heatpump: [
    { task: "Full service by F-Gas engineer", frequency: "Annually" },
    { task: "Filter clean", frequency: "Quarterly" },
    { task: "Glycol level & condition check", frequency: "Annually" },
    { task: "Condensate drain check", frequency: "Annually" },
  ],
  insulation: [
    { task: "Visual inspection of render/cladding", frequency: "Annually" },
    { task: "Render crack & blemish check", frequency: "Annually" },
    { task: "Expansion joint condition", frequency: "Annually" },
    { task: "Drainage & damp check at base", frequency: "Annually" },
  ],
};

const getScheduleKey = (jobType: string) => {
  if (isSolar(jobType)) return "solar";
  if (isHeatPump(jobType)) return "heatpump";
  if (isInsulation(jobType)) return "insulation";
  return null;
};

/* ── component ── */
const GreenCertificatePack = ({ jobType, isComplete = false }: GreenCertPackProps) => {
  // Grant docs
  const [grantScheme, setGrantScheme] = useState("");
  const [grantRef, setGrantRef] = useState("");
  const [grantValue, setGrantValue] = useState("");
  const [grantClaimRef, setGrantClaimRef] = useState("");
  const [grantDate, setGrantDate] = useState("");

  // MCS
  const [mcsCertNum, setMcsCertNum] = useState("");
  const [mcsInstallDate, setMcsInstallDate] = useState("");
  const [mcsSpec, setMcsSpec] = useState("");

  // EPC
  const [epcBefore, setEpcBefore] = useState("");
  const [epcAfter, setEpcAfter] = useState("");
  const [epcRefBefore, setEpcRefBefore] = useState("");
  const [epcRefAfter, setEpcRefAfter] = useState("");

  // System specs (solar)
  const [panelModel, setPanelModel] = useState("");
  const [numPanels, setNumPanels] = useState("");
  const [totalKwp, setTotalKwp] = useState("");
  const [inverterModel, setInverterModel] = useState("");
  const [batteryStorage, setBatteryStorage] = useState("");
  const [annualGen, setAnnualGen] = useState("");

  // System specs (heat pump)
  const [hpModel, setHpModel] = useState("");
  const [hpOutput, setHpOutput] = useState("");
  const [hpScop, setHpScop] = useState("");
  const [hpRefrigerant, setHpRefrigerant] = useState("");
  const [hpCylinder, setHpCylinder] = useState("");

  // System specs (insulation)
  const [insManufacturer, setInsManufacturer] = useState("");
  const [insProduct, setInsProduct] = useState("");
  const [insThickness, setInsThickness] = useState("");
  const [insUValue, setInsUValue] = useState("");
  const [insBba, setInsBba] = useState("");

  const scheduleKey = getScheduleKey(jobType);
  const schedule = scheduleKey ? MAINTENANCE[scheduleKey] : null;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-green-600 rounded-2xl p-5 flex items-center gap-3">
        <Leaf className="w-6 h-6 text-white" />
        <div>
          <h2 className="font-heading text-white text-2xl">Green Certificate Pack</h2>
          <p className="font-mono text-xs text-white/70 mt-0.5">
            Renewable & energy efficiency documentation for grant audits, mortgage applications, and property sale
          </p>
        </div>
      </div>

      {/* 1 — Grant Documentation */}
      <SectionCard title="Government Grant Documentation" icon={FileText}>
        <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
          <Field label="Grant Scheme Name" placeholder="e.g. ECO4, BUS, HUG2" value={grantScheme} onChange={setGrantScheme} />
          <Field label="Grant Reference Number" placeholder="REF-XXXX" value={grantRef} onChange={setGrantRef} />
          <Field label="Grant Value Received (£)" placeholder="10000" type="number" value={grantValue} onChange={setGrantValue} />
          <Field label="Installer Grant Claim Reference" value={grantClaimRef} onChange={setGrantClaimRef} />
          <Field label="Date Grant Claimed" type="date" value={grantDate} onChange={setGrantDate} />
        </div>
      </SectionCard>

      {/* 2 — MCS Installation Certificate */}
      <SectionCard title="MCS Installation Certificate" icon={CheckCircle2}>
        <FileUpload label="Upload MCS Certificate (PDF)" />
        <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
          <Field label="MCS Certificate Number" placeholder="MCS-XXXX-XXXX" value={mcsCertNum} onChange={setMcsCertNum} />
          <Field label="Installation Date" type="date" value={mcsInstallDate} onChange={setMcsInstallDate} />
        </div>
        <Field label="System Specification" placeholder="e.g. Daikin Altherma 12kW ASHP" value={mcsSpec} onChange={setMcsSpec} />
        <p className="font-mono text-[11px] text-green-600 bg-green-50 rounded-xl px-4 py-2">
          This certificate is required to register with the Smart Export Guarantee (SEG)
        </p>
      </SectionCard>

      {/* 3 — EPC Comparison */}
      <SectionCard title="EPC Comparison" icon={Thermometer}>
        <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
          <Select label="EPC Band Before Installation" options={EPC_BANDS} value={epcBefore} onChange={setEpcBefore} />
          <Select label="EPC Band After Installation" options={EPC_BANDS} value={epcAfter} onChange={setEpcAfter} />
          <Field label="EPC Certificate Ref (Before)" placeholder="0000-0000-0000-0000-0000" value={epcRefBefore} onChange={setEpcRefBefore} />
          <Field label="EPC Certificate Ref (After)" placeholder="0000-0000-0000-0000-0000" value={epcRefAfter} onChange={setEpcRefAfter} />
        </div>
        <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
          <FileUpload label="Upload EPC Before (PDF)" />
          <FileUpload label="Upload EPC After (PDF)" />
        </div>
        {epcBefore && epcAfter && (
          <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-heading text-2xl text-red-500">{epcBefore}</span>
              <span className="font-mono text-secondary-text">→</span>
              <span className="font-heading text-2xl text-green-600">{epcAfter}</span>
            </div>
            <span className="font-mono text-xs text-green-700">
              {EPC_BANDS.indexOf(epcAfter) < EPC_BANDS.indexOf(epcBefore)
                ? `Improved by ${EPC_BANDS.indexOf(epcBefore) - EPC_BANDS.indexOf(epcAfter)} band${EPC_BANDS.indexOf(epcBefore) - EPC_BANDS.indexOf(epcAfter) > 1 ? "s" : ""}`
                : "No improvement recorded"}
            </span>
          </div>
        )}
      </SectionCard>

      {/* 4 — System Specifications */}
      <SectionCard title="System Specifications" icon={isSolar(jobType) ? Sun : isHeatPump(jobType) ? Wind : Home}>
        {isSolar(jobType) && (
          <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
            <Field label="Panel Make/Model" value={panelModel} onChange={setPanelModel} />
            <Field label="Number of Panels" type="number" value={numPanels} onChange={setNumPanels} />
            <Field label="Total kWp" value={totalKwp} onChange={setTotalKwp} />
            <Field label="Inverter Make/Model" value={inverterModel} onChange={setInverterModel} />
            <Field label="Battery Storage (if fitted)" value={batteryStorage} onChange={setBatteryStorage} />
            <Field label="Annual Generation Estimate (kWh)" value={annualGen} onChange={setAnnualGen} />
          </div>
        )}
        {isHeatPump(jobType) && (
          <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
            <Field label="Make/Model" value={hpModel} onChange={setHpModel} />
            <Field label="Output (kW)" value={hpOutput} onChange={setHpOutput} />
            <Field label="SCOP Rating" value={hpScop} onChange={setHpScop} />
            <Field label="Refrigerant Type" value={hpRefrigerant} onChange={setHpRefrigerant} />
            <Field label="Cylinder Size (litres)" value={hpCylinder} onChange={setHpCylinder} />
          </div>
        )}
        {isInsulation(jobType) && (
          <div className="grid grid-cols-1 craft:grid-cols-2 gap-4">
            <Field label="Product Manufacturer" value={insManufacturer} onChange={setInsManufacturer} />
            <Field label="Product Name" value={insProduct} onChange={setInsProduct} />
            <Field label="Thickness (mm)" value={insThickness} onChange={setInsThickness} />
            <Field label="U-value Achieved (W/m²K)" value={insUValue} onChange={setInsUValue} />
            <Field label="BBA Certificate Number" value={insBba} onChange={setInsBba} />
          </div>
        )}
        {!isSolar(jobType) && !isHeatPump(jobType) && !isInsulation(jobType) && (
          <p className="font-mono text-xs text-secondary-text">System specification fields will appear based on the project type.</p>
        )}
      </SectionCard>

      {/* 5 — Maintenance Schedule */}
      {schedule && (
        <SectionCard title="Maintenance Schedule" icon={FileText}>
          <div className="bg-card rounded-xl border border-navy/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-navy/5">
                  <th className="text-left px-4 py-2 font-mono text-[10px] text-secondary-text uppercase">Task</th>
                  <th className="text-left px-4 py-2 font-mono text-[10px] text-secondary-text uppercase">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {schedule.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-sm text-body-text">{item.task}</td>
                    <td className="px-4 py-3 font-mono text-xs text-teal font-semibold">{item.frequency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-[11px] text-secondary-text">
            Follow this schedule to maintain warranty coverage and system performance.
          </p>
        </SectionCard>
      )}

      {/* Download button */}
      {isComplete && (
        <button className="w-full bg-green-600 text-white font-mono text-sm px-6 py-4 rounded-2xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 flex items-center justify-center gap-3">
          <Download className="w-5 h-5" />
          <span>Download Green Certificate Pack</span>
          <Leaf className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default GreenCertificatePack;
