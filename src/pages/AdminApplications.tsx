import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import SEO from "@/components/SEO";

const C = {
  cream: "#F5F0E8", deep: "#0F2238", navy: "#1B3A5C", teal: "#0D9488",
  dimText: "rgba(245,240,232,0.78)", darkBorder: "rgba(245,240,232,0.22)",
  white: "#FFFFFF", red: "#DC2626", border: "#E2E0DA", secondary: "#6B6B6B",
};

const ADMIN_NAV = [
  { to: "/admin", label: "← Admin" },
  { to: "/admin/verifications", label: "Verifications" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/suppliers", label: "Suppliers" },
  { to: "/admin/disputes", label: "Disputes" },
];

function AdminNav() {
  const { pathname } = useLocation();
  return (
    <div style={{ background: "#0A1A2E", padding: "8px 24px", display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${C.darkBorder}` }}>
      {ADMIN_NAV.map((n) => {
        const active = pathname === n.to;
        return (
          <NavLink key={n.to} to={n.to} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 6, textDecoration: "none", letterSpacing: "0.03em", color: active ? C.deep : C.dimText, background: active ? C.teal : "transparent" }}>
            {n.label}
          </NavLink>
        );
      })}
    </div>
  );
}

type DocMeta = { path: string; filename: string; size: number; mime: string; uploaded_at: string };

interface Application {
  id: string;
  applicant_email: string | null;
  full_name: string | null;
  business_name: string | null;
  trade_category_id: string | null;
  qualification_path: string | null;
  status: string;
  created_at: string;
  document_paths: Record<string, DocMeta[]> | null;
  form_data: Record<string, unknown> | null;
}

const FIELD_LABELS: Record<string, string> = {
  qual_card_doc: "Scheme card / certificate",
  qual_cert_doc: "Qualification certificate",
  insurance_certificate: "Certificate of Insurance",
  portfolio_photos: "Portfolio photos",
};

export default function AdminApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trade_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps(((data as unknown) as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const viewDoc = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("trade-application-docs")
      .createSignedUrl(path, 600);
    if (error || !data?.signedUrl) {
      toast.error(error?.message || "Could not generate a link for this file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const deleteApp = async (app: Application) => {
    if (!confirm(`Delete application from ${app.full_name || app.applicant_email || "this trade"}? This also removes their uploaded files.`)) return;
    setDeleting(app.id);
    try {
      // Collect every stored object path and remove the files first.
      const paths = Object.values(app.document_paths ?? {}).flat().map((d) => d.path);
      if (paths.length) {
        const { error: rmErr } = await supabase.storage.from("trade-application-docs").remove(paths);
        if (rmErr) throw rmErr;
      }
      const { error: delErr } = await supabase.from("trade_applications").delete().eq("id", app.id);
      if (delErr) throw delErr;
      toast.success("Application and files deleted");
      setApps((p) => p.filter((a) => a.id !== app.id));
    } catch (err: any) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

  return (
    <div style={{ minHeight: "100vh", background: C.cream }}>
      <SEO title="Trade Applications — Admin" description="Admin review of submitted trade applications and uploaded documents." path="/admin/applications" />
      <AdminNav />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.deep, margin: "0 0 4px" }}>Trade Applications</h1>
        <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 24px" }}>
          {loading ? "Loading…" : `${apps.length} application${apps.length === 1 ? "" : "s"}`}
        </p>

        {!loading && apps.length === 0 && (
          <p style={{ fontSize: 14, color: C.secondary }}>No applications yet.</p>
        )}

        {apps.map((app) => {
          const docGroups = Object.entries(app.document_paths ?? {});
          return (
            <div key={app.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.deep }}>{app.full_name || "—"}</div>
                  <div style={{ fontSize: 13, color: C.secondary }}>{app.business_name || "—"} · {app.applicant_email || "no email"}</div>
                  <div style={{ fontSize: 12, color: C.secondary, marginTop: 2 }}>
                    {app.trade_category_id || "—"} · {app.qualification_path || "—"} · {format(new Date(app.created_at), "d MMM yyyy, HH:mm")}
                  </div>
                </div>
                <button onClick={() => deleteApp(app)} disabled={deleting === app.id}
                  style={{ alignSelf: "flex-start", background: "none", border: `1px solid ${C.red}`, color: C.red, fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, cursor: "pointer", opacity: deleting === app.id ? 0.5 : 1 }}>
                  {deleting === app.id ? "Deleting…" : "Delete"}
                </button>
              </div>

              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {docGroups.length === 0 && <div style={{ fontSize: 13, color: C.secondary }}>No documents uploaded.</div>}
                {docGroups.map(([field, docs]) => (
                  <div key={field}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.deep, marginBottom: 6 }}>{FIELD_LABELS[field] || field}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {docs.map((d) => (
                        <div key={d.path} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 12, color: C.secondary }}>
                          <button onClick={() => viewDoc(d.path)} style={{ background: C.teal, color: C.white, border: "none", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View</button>
                          <span style={{ color: C.deep, fontWeight: 600 }}>{d.filename}</span>
                          <span>{fmtSize(d.size)}</span>
                          <span>{d.mime}</span>
                          <span>{d.uploaded_at ? format(new Date(d.uploaded_at), "d MMM HH:mm") : ""}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
