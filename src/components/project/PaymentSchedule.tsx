import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Stage {
  id: string;
  stage_name: string;
  payment_amount: number;
  payment_status: string;
  status: string;
}

interface PaymentScheduleProps {
  stages: Stage[];
  contractValue: number;
  userRole: "trade" | "homeowner" | null;
  onReleasePayment?: (stageId: string) => void;
}

const PaymentSchedule = ({ stages, contractValue, userRole, onReleasePayment }: PaymentScheduleProps) => (
  <section>
    <h2 className="font-heading text-navy text-2xl mb-4">Payment Schedule</h2>
    {stages.length === 0 ? (
      <div className="bg-white rounded-2xl p-6 border border-navy/10 text-center">
        <p className="font-mono text-sm text-secondary-text">No payment stages configured.</p>
      </div>
    ) : (
      <div className="bg-white rounded-2xl border border-navy/10 shadow-sm divide-y divide-navy/5">
        {stages.map((s) => (
          <div key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm text-navy font-semibold">{s.stage_name}</p>
                <p className="font-mono text-xs text-secondary-text">£{Number(s.payment_amount).toLocaleString()}</p>
              </div>
              <Badge className={
                s.payment_status === "paid" ? "bg-green-100 text-green-700" :
                s.payment_status === "due" ? "bg-amber-100 text-amber-700" :
                "bg-navy/5 text-navy/40"
              }>
                {s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)}
              </Badge>
            </div>
            {userRole === "homeowner" && s.status === "complete" && s.payment_status !== "paid" && onReleasePayment && (
              <button
                onClick={() => onReleasePayment(s.id)}
                className="mt-2 w-full bg-teal text-white font-mono text-xs py-2 rounded-xl hover:bg-teal-hover transition-colors"
              >
                Release Payment
              </button>
            )}
          </div>
        ))}
        <div className="p-4 flex items-center justify-between bg-navy/5">
          <p className="font-mono text-sm text-navy font-bold">Total</p>
          <p className="font-heading text-teal text-xl">£{contractValue.toLocaleString()}</p>
        </div>
      </div>
    )}
  </section>
);

export default PaymentSchedule;
