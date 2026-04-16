import { Leaf, Sun, Thermometer, Home, Download } from "lucide-react";

interface Props {
  greenData: any;
  jobId: string;
}

const ManualGreenSections = ({ greenData, jobId }: Props) => {
  const gd = greenData || {};

  return (
    <div className="space-y-6">
      {/* Section G1 — Grant Documentation */}
      <section id="grant" className="bg-card rounded-2xl border border-green-500/20 p-6">
        <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          G1. Grant Documentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GreenField label="Grant Scheme" value={gd.grant_scheme} />
          <GreenField label="Grant Reference" value={gd.grant_reference} />
          <GreenField label="Grant Value" value={gd.grant_value ? `£${Number(gd.grant_value).toLocaleString()}` : ""} />
          <GreenField label="Installer Claim Reference" value={gd.installer_claim_ref} />
        </div>
      </section>

      {/* Section G2 — MCS Installation Certificate */}
      <section id="mcs" className="bg-card rounded-2xl border border-green-500/20 p-6">
        <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5 text-green-600" />
          G2. MCS Installation Certificate
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <GreenField label="MCS Certificate Number" value={gd.mcs_cert_number} />
          <GreenField label="System Type" value={gd.system_type} />
          <GreenField label="Installation Date" value={gd.mcs_install_date ? new Date(gd.mcs_install_date).toLocaleDateString("en-GB") : ""} />
          <GreenField label="System Specification" value={gd.system_specification} />
        </div>
        {gd.mcs_cert_url && (
          <a href={gd.mcs_cert_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 font-mono text-xs text-secondary hover:text-secondary/80">
            View MCS Certificate →
          </a>
        )}
        <p className="mt-3 font-mono text-[10px] text-muted-foreground italic">
          Required to register with the Smart Export Guarantee and evidence for any future grant audits.
        </p>
      </section>

      {/* Section G3 — EPC Comparison */}
      <section id="epc" className="bg-card rounded-2xl border border-green-500/20 p-6">
        <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-green-600" />
          G3. EPC Comparison
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 border border-border rounded-xl">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Before Works</p>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-heading ${getEpcColor(gd.epc_before)}`}>
              {gd.epc_before || "—"}
            </div>
            {gd.epc_before_ref && <p className="font-mono text-[10px] text-muted-foreground mt-2">Ref: {gd.epc_before_ref}</p>}
          </div>
          <div className="text-center p-4 border border-border rounded-xl">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">After Works</p>
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-heading ${getEpcColor(gd.epc_after)}`}>
              {gd.epc_after || "—"}
            </div>
            {gd.epc_after_ref && <p className="font-mono text-[10px] text-muted-foreground mt-2">Ref: {gd.epc_after_ref}</p>}
          </div>
        </div>
      </section>

      {/* Section G4 — System Specifications */}
      <section id="system-specs" className="bg-card rounded-2xl border border-green-500/20 p-6">
        <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-green-600" />
          G4. System Specifications
        </h2>

        {/* Solar PV */}
        {gd.solar_panels_model && (
          <div className="mb-4">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Solar PV</h3>
            <div className="grid grid-cols-2 gap-2">
              <GreenField label="Panel Make/Model" value={gd.solar_panels_model} />
              <GreenField label="Number of Panels" value={gd.solar_panel_count?.toString()} />
              <GreenField label="Total kWp" value={gd.solar_total_kwp?.toString()} />
              <GreenField label="Inverter" value={gd.solar_inverter} />
              <GreenField label="Battery" value={gd.solar_battery} />
              <GreenField label="Expected Annual Yield" value={gd.solar_expected_yield ? `${gd.solar_expected_yield} kWh` : ""} />
            </div>
          </div>
        )}

        {/* Heat Pump */}
        {gd.hp_model && (
          <div className="mb-4">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Heat Pump</h3>
            <div className="grid grid-cols-2 gap-2">
              <GreenField label="Make/Model" value={gd.hp_model} />
              <GreenField label="Output kW" value={gd.hp_output_kw?.toString()} />
              <GreenField label="SCOP" value={gd.hp_scop?.toString()} />
              <GreenField label="Refrigerant" value={gd.hp_refrigerant} />
              <GreenField label="Cylinder Size" value={gd.hp_cylinder_size} />
              <GreenField label="Flow Temp Setting" value={gd.hp_flow_temp} />
            </div>
          </div>
        )}

        {/* Insulation */}
        {gd.insulation_product && (
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Insulation</h3>
            <div className="grid grid-cols-2 gap-2">
              <GreenField label="Product" value={gd.insulation_product} />
              <GreenField label="Thickness" value={gd.insulation_thickness_mm ? `${gd.insulation_thickness_mm}mm` : ""} />
              <GreenField label="U-Value" value={gd.insulation_u_value ? `${gd.insulation_u_value} W/m²K` : ""} />
              <GreenField label="BBA Certificate" value={gd.insulation_bba_cert} />
            </div>
          </div>
        )}

        {!gd.solar_panels_model && !gd.hp_model && !gd.insulation_product && (
          <p className="font-mono text-xs text-muted-foreground">No system specifications have been logged.</p>
        )}
      </section>

      {/* Section G5 — Green Maintenance */}
      <section id="green-maintenance" className="bg-card rounded-2xl border border-green-500/20 p-6">
        <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          G5. Green Maintenance
        </h2>
        <div className="space-y-4">
          {gd.solar_panels_model && (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Solar PV</h3>
              <MaintenanceItem task="Annual panel clean" freq="Annually" />
              <MaintenanceItem task="Inverter check" freq="Every 5 years" />
            </div>
          )}
          {gd.hp_model && (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Heat Pump</h3>
              <MaintenanceItem task="Annual service by F-Gas engineer" freq="Annually" />
              <MaintenanceItem task="Glycol check" freq="Annually" />
              <MaintenanceItem task="Filter clean" freq="Quarterly" />
            </div>
          )}
          {gd.insulation_product && (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">EWI / Insulation</h3>
              <MaintenanceItem task="Annual render crack check" freq="Annually" />
              <MaintenanceItem task="Expansion joint inspection" freq="Annually" />
            </div>
          )}
        </div>
      </section>

      {/* Download Green Certificate Pack */}
      <div className="text-center p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
        <Leaf className="w-8 h-8 text-green-600 mx-auto mb-3" />
        <h3 className="font-heading text-primary text-lg mb-1">Download Green Certificate Pack</h3>
        <p className="font-mono text-xs text-muted-foreground mb-4">
          Bundles Sections G1–G5 into a single branded PDF.
        </p>
        <button className="bg-green-600 text-white font-mono text-xs px-6 py-2.5 rounded-xl hover:bg-green-600/90 transition-colors">
          <Download className="w-3.5 h-3.5 inline mr-2" />
          Download Green Certificate Pack
        </button>
        <p className="font-mono text-[10px] text-muted-foreground mt-3 italic">
          Required for: grant audit claims, mortgage applications, property sale conveyancing, MCS audit
        </p>
      </div>
    </div>
  );
};

const GreenField = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
    <p className="font-mono text-xs text-foreground">{value || "—"}</p>
  </div>
);

const MaintenanceItem = ({ task, freq }: { task: string; freq: string }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
    <span className="font-mono text-xs text-foreground">{task}</span>
    <span className="font-mono text-[10px] text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">{freq}</span>
  </div>
);

function getEpcColor(band: string): string {
  const colors: Record<string, string> = {
    A: "bg-green-500 text-white",
    B: "bg-green-400 text-white",
    C: "bg-lime-400 text-foreground",
    D: "bg-yellow-400 text-foreground",
    E: "bg-orange-400 text-white",
    F: "bg-orange-600 text-white",
    G: "bg-destructive text-white",
  };
  return colors[band] || "bg-muted text-muted-foreground";
}

export default ManualGreenSections;
