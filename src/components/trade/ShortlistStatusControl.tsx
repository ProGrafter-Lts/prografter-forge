import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StickyNote, Check, X, Loader2 } from "lucide-react";

export type ShortlistStatus = "todo" | "contacted" | "quoted" | "won" | "dead";

interface ShortlistRow {
  id: string;
  contact_status: ShortlistStatus;
  note: string | null;
}

interface Props {
  tradeId: string;
  planningAlertId: string;
  initial?: ShortlistRow | null;
}

const STATUS_OPTIONS: { value: ShortlistStatus; label: string }[] = [
  { value: "todo", label: "To contact" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "dead", label: "Dead" },
];

const STATUS_STYLES: Record<ShortlistStatus, string> = {
  todo: "bg-muted text-foreground border-border",
  contacted: "bg-secondary/10 text-secondary border-secondary/30",
  quoted: "bg-primary/10 text-primary border-primary/30",
  won: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  dead: "bg-destructive/10 text-destructive border-destructive/30",
};

export const ShortlistStatusControl = ({ tradeId, planningAlertId, initial }: Props) => {
  const [row, setRow] = useState<ShortlistRow | null>(initial ?? null);
  const [saving, setSaving] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(initial?.note ?? "");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (noteOpen) noteRef.current?.focus();
  }, [noteOpen]);

  const upsert = async (patch: Partial<ShortlistRow>) => {
    setSaving(true);
    try {
      if (row?.id) {
        const { data, error } = await supabase
          .from("planning_alert_shortlist")
          .update(patch as any)
          .eq("id", row.id)
          .select("id, contact_status, note")
          .maybeSingle();
        if (error) throw error;
        if (data) setRow(data as ShortlistRow);
      } else {
        const { data, error } = await supabase
          .from("planning_alert_shortlist")
          .insert({
            trade_id: tradeId,
            planning_alert_id: planningAlertId,
            contact_status: (patch.contact_status as ShortlistStatus) ?? "todo",
            note: patch.note ?? null,
          } as any)
          .select("id, contact_status, note")
          .maybeSingle();
        if (error) throw error;
        if (data) setRow(data as ShortlistRow);
      }
    } catch (e: any) {
      toast({
        title: "Couldn't save",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as ShortlistStatus;
    await upsert({ contact_status: next });
    // Keep Find Work's pipeline tabs in sync with Pipeline-side changes.
    await mirrorShortlistToInteraction(tradeId, planningAlertId, next);
  };

  const saveNote = async () => {
    const trimmed = noteDraft.trim();
    await upsert({ note: trimmed.length ? trimmed : null });
    setNoteOpen(false);
  };

  const currentStatus: ShortlistStatus = row?.contact_status ?? "todo";
  const hasNote = !!row?.note;
  const isShortlisted = !!row;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <select
            value={currentStatus}
            onChange={onStatusChange}
            disabled={saving}
            aria-label="Lead status"
            className={`appearance-none font-mono text-[10px] uppercase tracking-wider pl-2.5 pr-7 py-1.5 rounded-full border cursor-pointer transition-colors disabled:opacity-60 ${
              isShortlisted ? STATUS_STYLES[currentStatus] : "bg-card text-muted-foreground border-dashed border-border"
            }`}
          >
            {!isShortlisted && <option value="todo">+ Add to leads</option>}
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {saving && (
            <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setNoteDraft(row?.note ?? "");
            setNoteOpen((o) => !o);
          }}
          className={`flex items-center gap-1 font-sans text-[10px] px-2 py-1.5 rounded-full border transition-colors ${
            hasNote
              ? "bg-secondary/10 text-secondary border-secondary/30"
              : "bg-card text-muted-foreground border-border hover:bg-muted"
          }`}
          aria-label={hasNote ? "Edit note" : "Add note"}
          title={hasNote ? "Edit note" : "Add note"}
        >
          <StickyNote className="w-3 h-3" />
          {hasNote ? "Note" : "Add note"}
        </button>
      </div>

      {noteOpen && (
        <div className="bg-muted/40 rounded-xl p-3 border border-border space-y-2">
          <textarea
            ref={noteRef}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, 2000))}
            placeholder="Notes for this lead — homeowner contact, follow-up details, etc."
            className="w-full bg-background rounded-md border border-border p-2 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px] resize-y"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              {noteDraft.length}/2000
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNoteOpen(false)}
                disabled={saving}
                className="flex items-center gap-1 font-sans text-[11px] px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNote}
                disabled={saving}
                className="flex items-center gap-1 font-sans text-[11px] px-2.5 py-1.5 rounded-md bg-secondary text-white hover:bg-secondary/90 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortlistStatusControl;
