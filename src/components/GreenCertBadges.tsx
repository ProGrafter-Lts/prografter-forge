import { Leaf, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TradeGreenData {
  is_green_trade: boolean;
  mcs_number?: string | null;
  trustmark_number?: string | null;
  pas_2030_accredited: boolean;
  pas_2035_coordinator: boolean;
  ozev_approved: boolean;
  fgas_registered: boolean;
  ciga_registered: boolean;
  inca_certified: boolean;
  green_cert_expiry?: string | null;
}

const CERT_BADGES = [
  { key: "mcs_number", label: "MCS Certified", desc: "Microgeneration Certification Scheme — required for solar PV and heat pump grant work", type: "text" },
  { key: "trustmark_number", label: "TrustMark Registered", desc: "Government-endorsed quality scheme", type: "text" },
  { key: "pas_2030_accredited", label: "PAS 2030 Accredited", desc: "Energy efficiency installation standard", type: "bool" },
  { key: "pas_2035_coordinator", label: "PAS 2035 Retrofit Coordinator", desc: "Whole-house retrofit qualification", type: "bool" },
  { key: "ozev_approved", label: "OZEV Approved", desc: "Office for Zero Emission Vehicles approved installer", type: "bool" },
  { key: "fgas_registered", label: "F-Gas Registered", desc: "Fluorinated gas handling — heat pump qualified", type: "bool" },
  { key: "inca_certified", label: "INCA Certified", desc: "Insulated Render and Cladding Association", type: "bool" },
  { key: "ciga_registered", label: "CIGA Registered", desc: "Cavity Insulation Guarantee Agency", type: "bool" },
] as const;

function getExpiryStatus(expiry: string | null | undefined): { label: string; color: string } | null {
  if (!expiry) return null;
  const diff = new Date(expiry).getTime() - Date.now();
  const days = diff / 86400000;
  if (days < 0) return { label: "Certification renewal required", color: "text-red-600 bg-red-50 border-red-200" };
  if (days <= 30) return { label: "Certification renewing soon", color: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: `Expires ${new Date(expiry).toLocaleDateString("en-GB")}`, color: "text-secondary-text bg-white border-navy/10" };
}

export const GreenSpecialistBanner = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <div className="bg-[#16A34A] text-white rounded-2xl px-5 py-3 flex items-center gap-3 font-mono text-sm">
      <Leaf className="w-5 h-5 shrink-0" />
      <span className="font-semibold tracking-wide uppercase text-xs">Renewable & Energy Efficiency Specialist</span>
    </div>
  );
};

export const CertificationsSection = ({ trade }: { trade: TradeGreenData }) => {
  const activeCerts = CERT_BADGES.filter((c) => {
    if (c.type === "text") return !!(trade as any)[c.key];
    return (trade as any)[c.key] === true;
  });

  if (activeCerts.length === 0) return null;

  const expiry = getExpiryStatus(trade.green_cert_expiry);

  return (
    <section className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
      <h3 className="font-heading text-navy text-xl mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
        Certifications & Accreditations
      </h3>

      <div className="space-y-3">
        {activeCerts.map((cert) => (
          <div key={cert.key} className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
            <Badge className="bg-[#16A34A] text-white border-0 shrink-0 mt-0.5">✓</Badge>
            <div>
              <p className="font-mono text-sm font-semibold text-navy">{cert.label}</p>
              <p className="font-mono text-xs text-secondary-text">{cert.desc}</p>
              {cert.key === "mcs_number" && trade.mcs_number && (
                <p className="font-mono text-xs text-[#16A34A] mt-1 flex items-center gap-1">
                  MCS Number: {trade.mcs_number} — verifiable at <a href="https://mcscertified.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">mcscertified.com <ExternalLink className="w-3 h-3" /></a>
                </p>
              )}
              {cert.key === "trustmark_number" && trade.trustmark_number && (
                <p className="font-mono text-xs text-[#16A34A] mt-1 flex items-center gap-1">
                  TrustMark No: {trade.trustmark_number} — verifiable at <a href="https://www.trustmark.org.uk" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">trustmark.org.uk <ExternalLink className="w-3 h-3" /></a>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {expiry && (
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-xs ${expiry.color}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {expiry.label}
        </div>
      )}
    </section>
  );
};
