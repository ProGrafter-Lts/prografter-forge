import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompress";

export interface QuickBuildPhoto {
  path: string;
  previewUrl: string;
  caption: string;
}

interface Props {
  userId: string;
  photos: QuickBuildPhoto[];
  onChange: (photos: QuickBuildPhoto[]) => void;
}

const MAX_PHOTOS = 8;

export const QuickBuildPhotoUploader = ({ userId, photos, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = MAX_PHOTOS - photos.length;
    if (slots <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos.`);
      return;
    }
    const incoming = Array.from(files).slice(0, slots);
    setUploading(true);
    const next = [...photos];
    try {
      for (const file of incoming) {
        const compressed = await compressImage(file);
        const path = `${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error } = await supabase.storage
          .from("quickbuild-photos")
          .upload(path, compressed, { contentType: "image/jpeg" });
        if (error) {
          toast.error(`Upload failed: ${error.message}`);
          continue;
        }
        next.push({
          path,
          previewUrl: URL.createObjectURL(compressed),
          caption: "",
        });
      }
      onChange(next);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (index: number) => {
    const p = photos[index];
    await supabase.storage.from("quickbuild-photos").remove([p.path]);
    URL.revokeObjectURL(p.previewUrl);
    onChange(photos.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    onChange(
      photos.map((p, i) => (i === index ? { ...p, caption: caption.slice(0, 200) } : p)),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            disabled={uploading || photos.length >= MAX_PHOTOS}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={uploading || photos.length >= MAX_PHOTOS}
          >
            <span>
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Add photos ({photos.length}/{MAX_PHOTOS})
            </span>
          </Button>
        </label>
      </div>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <Card key={p.path} className="relative overflow-hidden p-2">
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 z-10 rounded-full bg-background/90 p-1 shadow"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
              <img
                src={p.previewUrl}
                alt={`Job photo ${i + 1}`}
                className="mb-2 h-32 w-full rounded object-cover"
              />
              <Input
                value={p.caption}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Caption (optional)"
                className="h-8 text-xs"
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickBuildPhotoUploader;
