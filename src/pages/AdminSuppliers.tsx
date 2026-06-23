import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import SEO from "@/components/SEO";

interface SupplierRow {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  category: string;
  specialist_type: string | null;
  postcode: string;
  service_area: string;
  years_trading: number;
  has_public_liability: boolean;
  public_liability_amount: string | null;
  website: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  contacted_at: string | null;
  qualified_at: string | null;
  created_at: string;
}

const STATUS_FILTERS = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "phase_b_ready", label: "Phase B Ready" },
  { key: "declined", label: "Declined" },
  { key: "duplicate", label: "Duplicate" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  scaffolding: "Scaffolding",
  plant_skip_hire: "Plant / Skip",
  specialist_service: "Specialist",
};

const CATEGORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "scaffolding", label: "Scaffolding" },
  { key: "plant_skip_hire", label: "Plant / Skip" },
  { key: "specialist_service", label: "Specialist" },
] as const;

type StatusKey = typeof STATUS_FILTERS[number]["key"];
type CategoryKey = typeof CATEGORY_FILTERS[number]["key"];

const AdminSuppliers = () => {
  const [filter, setFilter] = useState<StatusKey>("new");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [working, setWorking] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("supplier_interest")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Failed to load suppliers");
    setRows((data as SupplierRow[]) || []);
    const c: Record<string, number> = {};
    for (const r of (data as SupplierRow[]) || []) {
      c[r.status] = (c[r.status] || 0) + 1;
    }
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.status !== filter) return false;
      if (category !== "all" && r.category !== category) return false;
      if (q) {
        const hay = `${r.business_name} ${r.postcode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, category, search]);

  const setStatus = async (r: SupplierRow, newStatus: string) => {
    setWorking(true);
    const patch: any = { status: newStatus };
    if (newStatus === "contacted" && !r.contacted_at) patch.contacted_at = new Date().toISOString();
    if (newStatus === "qualified" && !r.qualified_at) patch.qualified_at = new Date().toISOString();
    const { error } = await supabase.from("supplier_interest").update(patch).eq("id", r.id);
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${newStatus.replace("_", " ")}`);
    load();
  };

  const saveNotes = async (r: SupplierRow) => {
    setWorking(true);
    const { error } = await supabase
      .from("supplier_interest")
      .update({ admin_notes: notesDraft })
      .eq("id", r.id);
    setWorking(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notes saved");
    setNotesOpenId(null);
    setNotesDraft("");
    load();
  };

  const total = rows.length;

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Supplier Interest — Admin" description="Admin queue of supplier interest registrations." path="/admin/suppliers" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-heading text-navy text-4xl mb-2">Supplier Interest</h1>
        <p className="font-body text-secondary-text mb-6">
          Phase A registrations — contact each supplier personally.
        </p>

        <div className="bg-white rounded-2xl border border-navy/10 p-4 mb-6 grid grid-cols-2 md:grid-cols-6 gap-3">
          <Stat label="Total" value={total} />
          {STATUS_FILTERS.map((s) => (
            <Stat key={s.key} label={s.label} value={counts[s.key] || 0} />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider border transition-colors ${
                category === c.key
                  ? "bg-teal text-white border-teal"
                  : "bg-white text-navy border-navy/15 hover:bg-navy/5"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name or postcode…"
            className="max-w-md"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider border transition-colors ${
                filter === f.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-navy border-navy/10 hover:bg-navy/5"
              }`}
            >
              {f.label} {counts[f.key] ? `· ${counts[f.key]}` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-mono text-sm text-secondary-text">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-navy/10">
            <p className="font-body text-secondary-text">No suppliers in this state.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-navy/10 p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-heading text-2xl text-navy leading-tight">{r.business_name}</div>
                    <div className="font-body text-sm text-body-text">{r.contact_name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge className="bg-navy/10 text-navy hover:bg-navy/10">
                        {CATEGORY_LABELS[r.category] || r.category}
                      </Badge>
                      {r.specialist_type && (
                        <Badge className="bg-teal/10 text-teal hover:bg-teal/10">{r.specialist_type}</Badge>
                      )}
                      <Badge className="bg-navy/10 text-navy font-mono hover:bg-navy/10">{r.postcode}</Badge>
                      <Badge className="bg-navy/5 text-navy font-mono hover:bg-navy/5">
                        {r.years_trading} yrs
                      </Badge>
                      {r.has_public_liability ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          PL {r.public_liability_amount || "✓"}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">No PL</Badge>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-secondary-text text-right">
                    {format(new Date(r.created_at), "d MMM yyyy")}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 mb-3 font-mono text-xs text-body-text">
                  <div>
                    <a href={`mailto:${r.email}`} className="text-teal hover:underline break-all">{r.email}</a>
                  </div>
                  <div>
                    <a href={`tel:${r.phone}`} className="text-teal hover:underline">{r.phone}</a>
                  </div>
                  {r.service_area && (
                    <div className="sm:col-span-2 text-secondary-text">Area: {r.service_area}</div>
                  )}
                  {r.website && (
                    <div className="sm:col-span-2">
                      <a href={r.website} target="_blank" rel="noreferrer" className="text-teal hover:underline break-all">
                        {r.website}
                      </a>
                    </div>
                  )}
                  {r.notes && (
                    <div className="sm:col-span-2 text-secondary-text whitespace-pre-wrap">"{r.notes}"</div>
                  )}
                </div>

                {r.admin_notes && (
                  <div className="mb-3 bg-cream rounded-lg p-3 font-body text-sm text-body-text">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-secondary-text block mb-1">
                      Internal notes
                    </span>
                    <span className="whitespace-pre-wrap">{r.admin_notes}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <ActionBtn onClick={() => setStatus(r, "contacted")} disabled={working || r.status === "contacted"}>
                    Mark contacted
                  </ActionBtn>
                  <ActionBtn onClick={() => setStatus(r, "qualified")} disabled={working || r.status === "qualified"}>
                    Mark qualified
                  </ActionBtn>
                  <ActionBtn onClick={() => setStatus(r, "phase_b_ready")} disabled={working || r.status === "phase_b_ready"}>
                    Phase B ready
                  </ActionBtn>
                  <ActionBtn onClick={() => setStatus(r, "declined")} disabled={working || r.status === "declined"} variant="warn">
                    Decline
                  </ActionBtn>
                  <ActionBtn onClick={() => setStatus(r, "duplicate")} disabled={working || r.status === "duplicate"} variant="warn">
                    Duplicate
                  </ActionBtn>
                  <ActionBtn
                    onClick={() => {
                      setNotesOpenId(r.id);
                      setNotesDraft(r.admin_notes || "");
                    }}
                  >
                    Add notes
                  </ActionBtn>
                </div>

                {notesOpenId === r.id && (
                  <div className="mt-3 border-t border-navy/10 pt-3">
                    <Textarea
                      rows={3}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Internal notes (not shown to the supplier)…"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => saveNotes(r)} disabled={working} className="bg-navy text-white hover:bg-navy/90">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => { setNotesOpenId(null); setNotesDraft(""); }}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="font-mono text-[10px] uppercase tracking-widest text-secondary-text">{label}</div>
    <div className="font-heading text-2xl text-navy">{value}</div>
  </div>
);

const ActionBtn = ({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "warn";
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-wider border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      variant === "warn"
        ? "border-amber-300 text-amber-800 hover:bg-amber-50"
        : "border-navy/15 text-navy hover:bg-navy/5"
    }`}
  >
    {children}
  </button>
);

export default AdminSuppliers;
