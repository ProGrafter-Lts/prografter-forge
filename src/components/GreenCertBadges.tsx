import { Leaf, ShieldCheck, AlertTriangle, ExternalLink, BadgeCheck } from "lucide-react";

interface TradeGreenData {
  is_green_trade: boolean;
  mcs_number?: string | null;
  mcs_verified?: boolean;
  trustmark_number?: string | null;
  trustmark_verified?: boolean;
  pas_2030_accredited: boolean;
  pas_2035_coordinator: boolean;
  ozev_approved: boolean;
  fgas_registered: boolean;
  ciga_registered: boolean;
  inca_certified: boolean;
  green_cert_expiry?: string | null;
}

type ExpiryState = "ok" | "soon" | "expired";

function getExpiryState(expiry: string | null | undefined): ExpiryState {
  if (!expiry) return "ok";
  const days = (new Date(expiry).getTime() - Date.now()) / 86400000;
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

export const GreenSpecialistBanner = ({ show }: { show: boolean }) => {
  if (!show) return null;
  return (
    <div className="bg-[#16A34A] text-white rounded-2xl px-5 py-3 flex items-center gap-3 font-mono text-sm">
      <Leaf className="w-5 h-5 shrink-0" />
      <span className="font-semibold tracking-wide uppercase text-xs">
        Renewable & Energy Efficiency Specialist
      </span>
    </div>
  );
};

interface CertCardProps {
  title: string;
  subtitle: string;
  detail?: React.ReactNode;
  verified?: boolean;
}

const CertCard = ({ title, subtitle, detail, verified }: CertCardProps) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
    <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-[#16A34A] text-white flex items-center justify-center text-xs font-bold">
      ✓
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-mono text-sm font-semibold text-navy uppercase tracking-wide">
          {title}
        </p>
        {verified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#16A34A] bg-white border border-[#16A34A]/30 px-1.5 py-0.5 rounded-full">
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        )}
      </div>
      <p className="font-mono text-xs text-secondary-text mt-0.5">{subtitle}</p>
      {detail && <div className="font-mono text-xs text-[#16A34A] mt-1">{detail}</div>}
    </div>
  </div>
);

export const CertificationsSection = ({ trade }: { trade: TradeGreenData }) => {
  const expiry = getExpiryState(trade.green_cert_expiry);
  // If expired, hide all green certification badges from public view per spec.
  const hideAll = expiry === "expired";

  const cards: React.ReactNode[] = [];

  if (!hideAll && trade.mcs_number) {
    cards.push(
      <CertCard
        key="mcs"
        title="MCS Certified"
        subtitle="Microgeneration Certification Scheme"
        verified={!!trade.mcs_verified}
        detail={
          <span className="flex items-center gap-1 flex-wrap">
            <span>MCS No: {trade.mcs_number}</span>
            <span className="text-secondary-text">·</span>
            <span className="text-secondary-text">Verify at</span>
            <a
              href="https://mcscertified.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5"
            >
              mcscertified.com <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        }
      />,
    );
  }

  if (!hideAll && trade.trustmark_number) {
    cards.push(
      <CertCard
        key="trustmark"
        title="TrustMark Registered"
        subtitle="Government Endorsed Quality"
        verified={!!trade.trustmark_verified}
        detail={
          <span className="flex items-center gap-1 flex-wrap">
            <span>TrustMark No: {trade.trustmark_number}</span>
            <span className="text-secondary-text">·</span>
            <span className="text-secondary-text">Verify at</span>
            <a
              href="https://www.trustmark.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5"
            >
              trustmark.org.uk <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        }
      />,
    );
  }

  if (!hideAll && trade.pas_2030_accredited) {
    cards.push(
      <CertCard
        key="pas2030"
        title="PAS 2030 Accredited"
        subtitle="Energy Efficiency Standard"
        detail="Required for ECO4 and GBIS funded work"
      />,
    );
  }

  if (!hideAll && trade.pas_2035_coordinator) {
    cards.push(
      <CertCard
        key="pas2035"
        title="PAS 2035 Coordinator"
        subtitle="Whole-House Retrofit Qualification"
        detail="Mandatory for ECO4 whole-house assessments"
      />,
    );
  }

  if (!hideAll && trade.ozev_approved) {
    cards.push(
      <CertCard
        key="ozev"
        title="OZEV Approved"
        subtitle="Office for Zero Emission Vehicles"
        detail="Approved EV chargepoint installer"
      />,
    );
  }

  if (!hideAll && trade.fgas_registered) {
    cards.push(
      <CertCard
        key="fgas"
        title="F-Gas Registered"
        subtitle="Fluorinated Gas Handling"
        detail="Required for heat pump installation"
      />,
    );
  }

  if (!hideAll && trade.inca_certified) {
    cards.push(
      <CertCard
        key="inca"
        title="INCA Certified"
        subtitle="Insulated Render & Cladding Association"
        detail="EWI installation quality standard"
      />,
    );
  }

  if (!hideAll && trade.ciga_registered) {
    cards.push(
      <CertCard
        key="ciga"
        title="CIGA Registered"
        subtitle="Cavity Insulation Guarantee Agency"
        detail="25-year CIGA backed guarantee"
      />,
    );
  }

  // Nothing to show and nothing to warn about
  if (cards.length === 0 && expiry === "ok") return null;

  return (
    <section className="bg-white rounded-2xl p-5 border border-navy/10 shadow-sm">
      <h3 className="font-heading text-navy text-xl mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
        Certifications & Accreditations
      </h3>

      {cards.length > 0 ? (
        <div className="space-y-3">{cards}</div>
      ) : (
        <p className="font-mono text-xs text-secondary-text">
          Certifications are currently hidden because the renewal date has passed.
        </p>
      )}

      {expiry === "soon" && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-xs text-amber-700 bg-amber-50 border-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Renewing soon — your certification expires on{" "}
          {new Date(trade.green_cert_expiry!).toLocaleDateString("en-GB")}.
        </div>
      )}

      {expiry === "expired" && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-xs text-red-700 bg-red-50 border-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Renewal required — green certification badges are hidden from public view until you update your certificates.
        </div>
      )}
    </section>
  );
};
