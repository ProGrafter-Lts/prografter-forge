import { Calendar, MapPin, Briefcase, User, Building2, FileText } from "lucide-react";

interface Props {
  job: any;
  trade: any;
  homeowner: any;
  contract: any;
  stages: any[];
}

const ManualOverview = ({ job, trade, homeowner, contract, stages }: Props) => {
  const firstStage = stages.find(s => s.actual_start);
  const lastStage = [...stages].reverse().find(s => s.actual_end);

  return (
    <section id="overview" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-secondary" />
        1. Project Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoRow icon={Briefcase} label="Project Name" value={job.title || job.job_type} />
        <InfoRow icon={FileText} label="Reference" value={job.id?.slice(0, 8).toUpperCase()} />
        <InfoRow icon={MapPin} label="Property Address" value={`${job.address}, ${job.postcode}`} />
        <InfoRow icon={Briefcase} label="Project Type" value={job.job_type} />
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
        {contract && (
          <InfoRow
            icon={FileText}
            label="Contract Value"
            value={`£${Number(contract.agreed_price).toLocaleString()}`}
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
            <InfoRow icon={FileText} label="Trade Type" value={trade.trade_type} />
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
