import { Calendar, MapPin, Briefcase, User, Building2, FileText } from "lucide-react";
import { titleCase } from "@/lib/statusLabel";

interface Props {
  job: any;
  trade: any;
  homeowner: any;
  contract: any;
  stages: any[];
  acceptedQuoteAmount?: number | null;
}

const ManualOverview = ({ job, trade, homeowner, contract, stages, acceptedQuoteAmount }: Props) => {
  const firstStage = stages.find(s => s.actual_start);
  const lastStage = [...stages].reverse().find(s => s.actual_end);

  // Contract value resolution order:
  //   1. Modern contract `total_value_incl_vat_pence` (pence -> pounds)
  //   2. Legacy contract `agreed_price` (already in pounds)
  //   3. Accepted quote amount (pounds) — fallback when contract row hasn't been generated yet
  const resolveContractValuePounds = (): number | null => {
    if (contract?.total_value_incl_vat_pence != null) {
      const pounds = Number(contract.total_value_incl_vat_pence) / 100;
      if (!Number.isNaN(pounds)) return pounds;
    }
    if (contract?.agreed_price != null) {
      const pounds = Number(contract.agreed_price);
      if (!Number.isNaN(pounds)) return pounds;
    }
    if (acceptedQuoteAmount != null) {
      const pounds = Number(acceptedQuoteAmount);
      if (!Number.isNaN(pounds)) return pounds;
    }
    return null;
  };
  const contractValuePounds = resolveContractValuePounds();

  return (
    <section id="overview" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-secondary" />
        1. Project Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow icon={Briefcase} label="Project Name" value={job.title || titleCase(job.job_type)} />
        <InfoRow icon={FileText} label="Reference" value={job.id?.slice(0, 8).toUpperCase()} />
        <InfoRow icon={MapPin} label="Property Address" value={`${job.address}, ${job.postcode}`} />
        <InfoRow icon={Briefcase} label="Project Type" value={titleCase(job.job_type)} />
        <InfoRow
          icon={Calendar}
          label="Start Date"
          value={firstStage?.actual_start ? new Date(firstStage.actual_start).toLocaleDateString("en-GB") : "—"}
        />
        <InfoRow
          icon={Calendar}
          label="Completion Date"
          value={lastStage?.actual_end ? new Date(lastStage.actual_end).toLocaleDateString("en-GB") : "—"}
        />
        {contractValuePounds != null && (
          <InfoRow
            icon={FileText}
            label="Contract Value"
            value={`£${contractValuePounds.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`}
          />
        )}
        <InfoRow icon={FileText} label="ProGrafter Ref" value={`PG-${job.id?.slice(0, 8).toUpperCase()}`} />
      </div>

      {trade && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
            Trade Professional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow icon={User} label="Name" value={trade.name} />
            <InfoRow icon={Building2} label="Company" value={trade.company_name} />
            <InfoRow icon={FileText} label="Phone" value={trade.phone} />
            <InfoRow icon={FileText} label="Trade Type" value={titleCase(trade.trade_type)} />
          </div>
        </div>
      )}

      <p className="mt-6 font-mono text-xs text-muted-foreground italic border-t border-border pt-4">
        This document serves as the official record of works carried out at the above address.
      </p>
    </section>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <Icon className="w-3.5 h-3.5 text-secondary mt-0.5 flex-shrink-0" />
    <div>
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className="font-mono text-xs text-foreground">{value}</p>
    </div>
  </div>
);

export default ManualOverview;
