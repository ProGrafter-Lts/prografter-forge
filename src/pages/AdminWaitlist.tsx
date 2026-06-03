import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import SEO from "@/components/SEO";

interface EarlySignup {
  id: string;
  name: string;
  email: string;
  postcode: string;
  user_type: string;
  status: string;
  admin_notes: string | null;
  status_updated_at: string | null;
  created_at: string;
  is_test: boolean;
}

// Launch area = Nottinghamshire & East Midlands
const LAUNCH_AREA_PREFIXES = ["NG", "DE", "LE", "S", "DN"] as const;
const isInLaunchArea = (postcode: string | null) => {
  if (!postcode) return false;
  const p = postcode.trim().toUpperCase().replace(/\s+/g, "");
  return LAUNCH_AREA_PREFIXES.some((pre) => p.startsWith(pre));
};

type FilterKey = "all" | "in_area" | "out_of_area" | "dismissed" | "test";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All active" },
  { key: "in_area", label: "In area" },
  { key: "out_of_area", label: "Out of area" },
  { key: "dismissed", label: "Archived" },
  { key: "test", label: "Test accounts" },
];

const AdminWaitlist = () => {
  const [rows, setRows] = useState<EarlySignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [working, setWorking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("early_signups" as any)
      .select("id,name,email,postcode,user_type,status,admin_notes,status_updated_at,created_at,is_test")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load signups");
      console.warn(error);
    }
    setRows(((data as unknown) as EarlySignup[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "test") return r.is_test;
      if (r.is_test) return false;
      const dismissed = r.status === "dismissed";
      if (filter === "dismissed") return dismissed;
      if (dismissed) return false;
      if (filter === "in_area") return isInLaunchArea(r.postcode);
      if (filter === "out_of_area") return !isInLaunchArea(r.postcode);
      return true;
    });
  }, [rows, filter]);

  const counts = useMemo(() => {
    const real = rows.filter((r) => !r.is_test);
    const active = real.filter((r) => r.status !== "dismissed");
    return {
      all: active.length,
      in_area: active.filter((r) => isInLaunchArea(r.postcode)).length,
      out_of_area: active.filter((r) => !isInLaunchArea(r.postcode)).length,
      dismissed: real.filter((r) => r.status === "dismissed").length,
      test: rows.filter((r) => r.is_test).length,
    };
  }, [rows]);

  const toggleTest = async (row: EarlySignup) => {
    setWorking(row.id);
    const next = !row.is_test;
    const { error } = await supabase
      .from("early_signups" as any)
      .update({ is_test: next } as any)
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
    } else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_test: next } : r)));
      toast.success(next ? "Marked as test account" : "Marked as real signup");
    }
    setWorking(null);
  };

  const setStatus = async (row: EarlySignup, status: string) => {
    setWorking(row.id);
    const { error } = await supabase
      .from("early_signups" as any)
      .update({ status, status_updated_at: new Date().toISOString() } as any)
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
    } else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status } : r)));
      toast.success(status === "dismissed" ? "Dismissed" : "Restored");
    }
    setWorking(null);
  };

  const emailOutOfArea = async (row: EarlySignup, alsoDismiss: boolean) => {
    setWorking(row.id);
    const firstName = (row.name || "").trim().split(/\s+/)[0] || "";
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "waitlist-out-of-area",
          recipientEmail: row.email,
          idempotencyKey: `waitlist-ooa-${row.id}`,
          templateData: { name: firstName },
        },
      });
      if (error) throw error;
      toast.success(`"Coming soon" email sent to ${row.email}`);
      if (alsoDismiss) {
        await supabase
          .from("early_signups" as any)
          .update({ status: "dismissed", status_updated_at: new Date().toISOString() } as any)
          .eq("id", row.id);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "dismissed" } : r)));
      } else {
        await supabase
          .from("early_signups" as any)
          .update({ status: "contacted", status_updated_at: new Date().toISOString() } as any)
          .eq("id", row.id);
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "contacted" } : r)));
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to send email");
    }
    setWorking(null);
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Waitlist Signups — Admin" description="Admin view of early access waitlist signups." path="/admin/waitlist" noindex />
      <header className="border-b border-navy/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-2xl text-navy">
            Pro<span className="text-teal">Grafter</span>
            <span className="ml-3 text-xs font-mono uppercase tracking-widest text-secondary-text">admin</span>
          </Link>
          <nav className="flex gap-4 font-mono text-xs uppercase tracking-widest">
            <Link to="/admin" className="text-navy hover:text-teal">← Admin home</Link>
            <Link to="/admin/verifications" className="text-navy hover:text-teal">Verifications</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="font-heading text-navy text-4xl mb-2">Waitlist Signups</h1>
        <p className="font-body text-secondary-text mb-6 max-w-2xl">
          Early-access waitlist signups. Out-of-area people (outside Nottinghamshire / East Midlands)
          can be emailed a friendly "coming soon — we'll keep your details and contact you when we
          launch in your area" note, then archived from your active feed (their details stay on file).
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-mono uppercase tracking-widest border transition-colors ${
                filter === f.key
                  ? "bg-navy text-cream border-navy"
                  : "bg-white text-navy border-navy/15 hover:border-teal"
              }`}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-mono text-sm text-secondary-text">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="font-mono text-sm text-secondary-text">No signups in this view.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => {
              const inArea = isInLaunchArea(row.postcode);
              const busy = working === row.id;
              const dismissed = row.status === "dismissed";
              return (
                <div key={row.id} className="bg-white rounded-2xl border border-navy/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading text-lg text-navy">{row.name || "—"}</span>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">{row.user_type}</Badge>
                        {inArea ? (
                          <Badge className="bg-teal/15 text-teal border-0 font-mono text-[10px] uppercase">In area</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 border-0 font-mono text-[10px] uppercase">Out of area</Badge>
                        )}
                        {row.status === "contacted" && (
                          <Badge className="bg-navy/10 text-navy border-0 font-mono text-[10px] uppercase">Contacted</Badge>
                        )}
                        {dismissed && (
                          <Badge className="bg-secondary-text/15 text-secondary-text border-0 font-mono text-[10px] uppercase">Archived</Badge>
                        )}
                        {row.is_test && (
                          <Badge className="bg-purple-100 text-purple-700 border-0 font-mono text-[10px] uppercase">Test</Badge>
                        )}
                      </div>
                      <div className="mt-1 font-body text-sm text-secondary-text break-all">
                        <a href={`mailto:${row.email}`} className="text-navy hover:text-teal underline">{row.email}</a>
                        {" · "}
                        <span className="font-mono uppercase">{row.postcode}</span>
                        {" · "}
                        {format(new Date(row.created_at), "d MMM yyyy")}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {!dismissed && !inArea && (
                        <button
                          disabled={busy}
                          onClick={() => emailOutOfArea(row, true)}
                          className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-widest bg-teal text-cream hover:bg-teal-hover disabled:opacity-50"
                        >
                          Email "coming soon" + archive
                        </button>
                      )}
                      {!dismissed && !inArea && (
                        <button
                          disabled={busy}
                          onClick={() => emailOutOfArea(row, false)}
                          className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-widest bg-white border border-navy/15 text-navy hover:border-teal disabled:opacity-50"
                        >
                          Email only
                        </button>
                      )}
                      {!dismissed ? (
                        <button
                          disabled={busy}
                          onClick={() => setStatus(row, "dismissed")}
                          className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-widest bg-white border border-navy/15 text-secondary-text hover:border-navy disabled:opacity-50"
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => setStatus(row, "new")}
                          className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-widest bg-white border border-navy/15 text-navy hover:border-teal disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => toggleTest(row)}
                        className="px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-widest bg-white border border-navy/15 text-secondary-text hover:border-purple-400 disabled:opacity-50"
                      >
                        {row.is_test ? "Mark real" : "Mark test"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminWaitlist;
