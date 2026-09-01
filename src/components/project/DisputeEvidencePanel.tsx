import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { getJobPhotoSignedUrl } from "@/lib/jobPhotos";

/**
 * Evidence upload + listing for a dispute. Both parties (and admins) may add
 * photos or documents; everything is written to the existing `dispute_evidence`
 * table and stored under `disputes/<job_id>/…` in the job-photos bucket.
 */

export interface EvidenceRow {
  id: string;
  item_type: string;
  label: string;
  url: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

const C = {
  cream: "#F5F0E8", deep: "#0F2238", teal: "#14A8A1",
  body: "#1F2937", secondary: "#4B5563", border: "#D1CBB8", white: "#FFFFFF",
  red: "#DC2626",
};

const EvidenceThumb = ({ item }: { item: EvidenceRow }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      if (!item.url) return;
      const signed = await getJobPhotoSignedUrl(item.url);
      if (live) setSrc(signed || item.url);
    })();
    return () => { live = false; };
  }, [item.url]);

  if (item.item_type === "photo" && src) {
    return (
      <a href={src} target="_blank" rel="noreferrer">
        <img src={src} alt={item.label}
          style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
      </a>
    );
  }
  return (
    <a href={src || "#"} target="_blank" rel="noreferrer"
      style={{ display: "flex", alignItems: "center", justifyContent: "center",
        width: 96, height: 96, borderRadius: 8, border: `1px solid ${C.border}`,
        background: C.cream, fontSize: 11, color: C.secondary, textAlign: "center", padding: 6 }}>
      {item.item_type === "message" ? "Message" : "Document"}
    </a>
  );
};

export default function DisputeEvidencePanel({
  disputeId,
  jobId,
  role,
  canUpload = true,
}: {
  disputeId: string;
  jobId: string;
  role: string;
  canUpload?: boolean;
}) {
  const [items, setItems] = useState<EvidenceRow[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("dispute_evidence")
      .select("id, item_type, label, url, uploaded_by, uploaded_at")
      .eq("dispute_id", disputeId)
      .order("uploaded_at", { ascending: true });
    setItems((data as EvidenceRow[]) || []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [disputeId]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const payload = isImage ? await compressImage(file) : file;
        const ext = payload.name.split(".").pop() || "bin";
        const path = `disputes/${jobId}/${disputeId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("job-photos")
          .upload(path, payload, { contentType: payload.type || undefined });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("dispute_evidence").insert({
          dispute_id: disputeId,
          item_type: isImage ? "photo" : "document",
          label: label.trim() || file.name,
          url: path,
          uploaded_by: role,
        });
        if (insErr) throw insErr;
      }
      await supabase.from("dispute_events").insert({
        dispute_id: disputeId,
        event_type: "evidence",
        event_text: `Evidence submitted by ${role}`,
      });
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    }
    setBusy(false);
  };

  return (
    <div style={{ background: C.white, border: `1.5px solid ${C.border}`,
      borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: C.teal, letterSpacing: "0.08em",
        textTransform: "uppercase", margin: "0 0 10px" }}>Evidence</p>

      {items.length === 0 && (
        <p style={{ fontSize: 12, color: C.secondary, margin: "0 0 10px" }}>
          No evidence submitted yet.
        </p>
      )}

      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          {items.map((it) => (
            <div key={it.id} style={{ width: 96 }}>
              <EvidenceThumb item={it} />
              <p style={{ fontSize: 10, color: C.body, margin: "4px 0 0", wordBreak: "break-word" }}>
                {it.label}
              </p>
              <p style={{ fontSize: 9, color: C.secondary, margin: 0 }}>
                {it.uploaded_by} · {new Date(it.uploaded_at).toLocaleDateString("en-GB",
                  { day: "numeric", month: "short" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {canUpload && (
        <div style={{ borderTop: `1px solid ${C.cream}`, paddingTop: 10 }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional label (e.g. 'Cracked render, north wall')"
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8,
              border: `1.5px solid ${C.border}`, fontSize: 12, boxSizing: "border-box",
              marginBottom: 8, outline: "none" }} />
          <input ref={fileRef} type="file" multiple
            accept="image/*,application/pdf"
            onChange={(e) => onFiles(e.target.files)} disabled={busy}
            style={{ fontSize: 12, color: C.body }} />
          {busy && <p style={{ fontSize: 11, color: C.secondary, margin: "6px 0 0" }}>Uploading…</p>}
          {err && <p style={{ fontSize: 11, color: C.red, margin: "6px 0 0" }}>{err}</p>}
        </div>
      )}
    </div>
  );
}
