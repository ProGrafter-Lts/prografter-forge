import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

export interface AILineItem {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number;
  labour_or_materials: "labour" | "materials";
  _aiOriginated?: boolean;
}

export interface AIQuoteOutput {
  line_items: AILineItem[];
  methodology: string;
  timeline_days: number;
  risk_flags: string[];
  variation_buffer_recommended_pence: number;
  confidence_score: number;
  notes_to_trade: string;
}

const ALL_FLAGS = [
  "planning_permission_likely",
  "building_control_required",
  "part_p_notification_required",
  "gas_safe_required",
  "scaffold_needed",
  "asbestos_consideration",
  "listed_building_consent",
  "specialist_contractor_required",
  "neighbour_party_wall_notice",
  "lead_paint_risk",
];

interface Props {
  initial: AIQuoteOutput;
  onAccept: (final: AIQuoteOutput) => void;
  onBack: () => void;
}

export const QuickBuildReview = ({ initial, onAccept, onBack }: Props) => {
  const [draft, setDraft] = useState<AIQuoteOutput>({
    ...initial,
    line_items: initial.line_items.map((li) => ({ ...li, _aiOriginated: true })),
  });
  const [edited, setEdited] = useState<Record<string, boolean>>({});

  const markEdited = (k: string) => setEdited((p) => ({ ...p, [k]: true }));

  const updateLine = (i: number, patch: Partial<AILineItem>) => {
    setDraft((d) => ({
      ...d,
      line_items: d.line_items.map((li, idx) =>
        idx === i ? { ...li, ...patch, _aiOriginated: false } : li,
      ),
    }));
  };

  const addLine = () => {
    setDraft((d) => ({
      ...d,
      line_items: [
        ...d.line_items,
        {
          category: "",
          description: "",
          quantity: 1,
          unit: "item",
          estimated_unit_price: 0,
          labour_or_materials: "materials",
          _aiOriginated: false,
        },
      ],
    }));
  };

  const removeLine = (i: number) =>
    setDraft((d) => ({
      ...d,
      line_items: d.line_items.filter((_, idx) => idx !== i),
    }));

  const toggleFlag = (flag: string) =>
    setDraft((d) => ({
      ...d,
      risk_flags: d.risk_flags.includes(flag)
        ? d.risk_flags.filter((f) => f !== flag)
        : [...d.risk_flags, flag],
    }));

  const total = draft.line_items.reduce(
    (sum, li) => sum + (Number(li.quantity) || 0) * (Number(li.estimated_unit_price) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>AI-generated draft — review every line before sending.</strong>
        <div className="mt-1 text-xs opacity-80">
          Confidence: {draft.confidence_score}/100. Yellow rows came straight from AI;
          they turn neutral once you edit them.
        </div>
        {draft.notes_to_trade && (
          <div className="mt-2 text-xs italic">{draft.notes_to_trade}</div>
        )}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Schedule of Works</h3>
          <Button onClick={addLine} variant="outline" size="sm">
            <Plus className="h-4 w-4" /> Add line
          </Button>
        </div>
        <div className="space-y-2">
          {draft.line_items.map((li, i) => (
            <div
              key={i}
              className={`grid grid-cols-12 gap-2 rounded p-2 ${
                li._aiOriginated ? "bg-amber-50/60" : "bg-muted/40"
              }`}
            >
              <Input
                className="col-span-12 sm:col-span-3"
                value={li.category}
                placeholder="Category"
                onChange={(e) => updateLine(i, { category: e.target.value })}
              />
              <Input
                className="col-span-12 sm:col-span-4"
                value={li.description}
                placeholder="Description"
                onChange={(e) => updateLine(i, { description: e.target.value })}
              />
              <Input
                type="number"
                className="col-span-3 sm:col-span-1"
                value={li.quantity}
                onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
              />
              <Input
                className="col-span-3 sm:col-span-1"
                value={li.unit}
                placeholder="unit"
                onChange={(e) => updateLine(i, { unit: e.target.value })}
              />
              <Input
                type="number"
                className="col-span-4 sm:col-span-2"
                value={li.estimated_unit_price}
                onChange={(e) =>
                  updateLine(i, { estimated_unit_price: Number(e.target.value) })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="col-span-2 sm:col-span-1"
                onClick={() => removeLine(i)}
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-sm font-semibold">
          Subtotal: £{total.toFixed(2)}
        </div>
      </Card>

      <Card className={`p-4 ${edited.methodology ? "" : "border-amber-300"}`}>
        <Label>Methodology</Label>
        <Textarea
          rows={5}
          value={draft.methodology}
          onChange={(e) => {
            setDraft((d) => ({ ...d, methodology: e.target.value }));
            markEdited("methodology");
          }}
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={`p-4 ${edited.timeline ? "" : "border-amber-300"}`}>
          <Label>Timeline (days)</Label>
          <Input
            type="number"
            value={draft.timeline_days}
            onChange={(e) => {
              setDraft((d) => ({ ...d, timeline_days: Number(e.target.value) }));
              markEdited("timeline");
            }}
          />
        </Card>
        <Card className={`p-4 ${edited.buffer ? "" : "border-amber-300"}`}>
          <Label>Variation buffer (£)</Label>
          <Input
            type="number"
            value={(draft.variation_buffer_recommended_pence / 100).toFixed(2)}
            onChange={(e) => {
              setDraft((d) => ({
                ...d,
                variation_buffer_recommended_pence: Math.round(Number(e.target.value) * 100),
              }));
              markEdited("buffer");
            }}
          />
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <Label className="!m-0">Risk & compliance flags</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_FLAGS.map((f) => {
            const active = draft.risk_flags.includes(f);
            return (
              <Badge
                key={f}
                onClick={() => toggleFlag(f)}
                variant={active ? "default" : "outline"}
                className="cursor-pointer"
              >
                {f.replaceAll("_", " ")}
              </Badge>
            );
          })}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => {
            const cleaned = {
              ...draft,
              line_items: draft.line_items.map(({ _aiOriginated, ...rest }) => rest),
            } as AIQuoteOutput;
            onAccept(cleaned);
          }}
        >
          Use this quote
        </Button>
      </div>
    </div>
  );
};

export default QuickBuildReview;
