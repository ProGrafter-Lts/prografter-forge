import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, ImageOff } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";
import { getFieldPhotos, putPhoto, deletePhoto, type LocalPhoto } from "./offlineDb";
import { refreshPendingCounts, syncNow } from "./sync";

/**
 * Camera lives inside the field itself — tapping "Take photo" opens the
 * device camera and the result attaches to this exact field_key. There is
 * no separate upload step and no unattached photo pool.
 */
export default function PhotoField({
  surveyId,
  fieldKey,
  requirement,
  onCountChange,
}: {
  surveyId: string;
  fieldKey: string;
  requirement: "required" | "optional";
  onCountChange?: (n: number) => void;
}) {
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const rows = await getFieldPhotos(surveyId, fieldKey);
    setPhotos(rows);
    onCountChange?.(rows.length);
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.localId] = URL.createObjectURL(r.blob)));
    setUrls((prev) => {
      Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
      return map;
    });
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, fieldKey]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        // Client-side compression before it ever touches the network.
        const compressed = await compressImage(f, 600 * 1024, 1600);
        await putPhoto(surveyId, fieldKey, compressed);
      }
      await load();
      await refreshPendingCounts(surveyId);
      void syncNow(surveyId);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
      <div className="flex flex-wrap gap-2">
        {photos.map((p) => (
          <div key={p.localId} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
            {urls[p.localId] ? (
              <img src={urls[p.localId]} alt={`Evidence for ${fieldKey}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <ImageOff className="w-4 h-4 text-white/40" />
              </div>
            )}
            {!p.uploaded && (
              <span className="absolute top-1 left-1 text-[9px] px-1 rounded bg-amber-500/80 text-black font-medium">
                local
              </span>
            )}
            <button
              type="button"
              aria-label="Remove photo"
              onClick={async () => {
                await deletePhoto(p.localId);
                await load();
              }}
              className="absolute bottom-1 right-1 p-1 rounded bg-black/70 text-white/80 hover:text-white"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-20 h-20 rounded-lg border border-dashed border-teal-400/40 bg-teal-400/5 text-teal-200 flex flex-col items-center justify-center gap-1 text-[10px] disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          {busy ? "Saving…" : "Take photo"}
        </button>
      </div>
      {requirement === "required" && photos.length === 0 && (
        <p className="mt-2 text-xs text-amber-300/90">Photo evidence required for this field.</p>
      )}
    </div>
  );
}
