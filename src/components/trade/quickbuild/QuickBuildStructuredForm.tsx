import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface QuickBuildStructured {
  trade_type: string;
  property_type: string;
  property_age: string;
  postcode: string;
  hourly_rate_pounds: string;
  day_rate_pounds: string;
}

export const emptyStructured = (): QuickBuildStructured => ({
  trade_type: "",
  property_type: "",
  property_age: "",
  postcode: "",
  hourly_rate_pounds: "",
  day_rate_pounds: "",
});

interface Props {
  value: QuickBuildStructured;
  onChange: (v: QuickBuildStructured) => void;
}

const TRADES = [
  "electrical",
  "plumbing",
  "kitchen",
  "bathroom",
  "extension",
  "decoration",
  "other",
];
const PROPERTY_TYPES = ["terraced", "semi", "detached", "flat", "commercial"];
const AGE_BANDS = [
  "pre-1900",
  "1900-1939",
  "1940-1979",
  "1980-2010",
  "post-2010",
];

export const QuickBuildStructuredForm = ({ value, onChange }: Props) => {
  const set = <K extends keyof QuickBuildStructured>(
    k: K,
    v: QuickBuildStructured[K],
  ) => onChange({ ...value, [k]: v });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label>Trade type</Label>
        <Select value={value.trade_type} onValueChange={(v) => set("trade_type", v)}>
          <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
          <SelectContent>
            {TRADES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Property type</Label>
        <Select value={value.property_type} onValueChange={(v) => set("property_type", v)}>
          <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Property age</Label>
        <Select value={value.property_age} onValueChange={(v) => set("property_age", v)}>
          <SelectTrigger><SelectValue placeholder="Select age band" /></SelectTrigger>
          <SelectContent>
            {AGE_BANDS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Job postcode (first half)</Label>
        <Input
          value={value.postcode}
          onChange={(e) => set("postcode", e.target.value.toUpperCase().slice(0, 4))}
          placeholder="e.g. SW1"
        />
      </div>
      <div className="space-y-1">
        <Label>Hourly rate (£)</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={value.hourly_rate_pounds}
          onChange={(e) => set("hourly_rate_pounds", e.target.value)}
          placeholder="e.g. 55"
        />
      </div>
      <div className="space-y-1">
        <Label>Day rate (£) — optional</Label>
        <Input
          type="number"
          inputMode="decimal"
          value={value.day_rate_pounds}
          onChange={(e) => set("day_rate_pounds", e.target.value)}
          placeholder="e.g. 350"
        />
      </div>
    </div>
  );
};

export default QuickBuildStructuredForm;
