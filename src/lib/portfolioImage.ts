import heic2any from "heic2any";

// Shared limit and accepted-format messaging for portfolio photo uploads.
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FORMATS_LABEL = "JPG, PNG or HEIC";

const isHeic = (file: File) =>
  /image\/(heic|heif)/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

const isJpegOrPng = (file: File) =>
  /image\/(jpe?g|png)/i.test(file.type) || /\.(jpe?g|png)$/i.test(file.name);

export const fmtBytes = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)}MB`
    : `${Math.max(1, Math.round(b / 1024))}KB`;

export type ImageResult =
  | { ok: true; file: File }
  | { ok: false; name: string; reason: string };

// Validate and (for iPhone HEIC photos) convert a single selected image to a
// web-friendly JPEG. Returns a plain-English reason on any failure so the UI
// can show it inline next to the named file.
export async function processImageFile(file: File): Promise<ImageResult> {
  if (!file.size) {
    return {
      ok: false,
      name: file.name,
      reason: `"${file.name}" appears to be empty or corrupted. Please choose a different photo.`,
    };
  }

  const heic = isHeic(file);
  if (!heic && !isJpegOrPng(file)) {
    return {
      ok: false,
      name: file.name,
      reason: `"${file.name}" isn't a supported image. Accepted formats: ${ACCEPTED_FORMATS_LABEL}.`,
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      name: file.name,
      reason: `"${file.name}" is ${fmtBytes(file.size)} — over the 10MB limit. Please upload a smaller photo.`,
    };
  }

  if (heic) {
    try {
      const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      const blob = (Array.isArray(converted) ? converted[0] : converted) as Blob;
      const jpg = new File(
        [blob],
        file.name.replace(/\.(heic|heif)$/i, "") + ".jpg",
        { type: "image/jpeg" },
      );
      if (jpg.size > MAX_IMAGE_BYTES) {
        return {
          ok: false,
          name: file.name,
          reason: `"${file.name}" is ${fmtBytes(jpg.size)} after conversion — over the 10MB limit. Please upload a smaller photo.`,
        };
      }
      return { ok: true, file: jpg };
    } catch {
      return {
        ok: false,
        name: file.name,
        reason: `"${file.name}" couldn't be read — the file may be corrupted. Please try a different photo.`,
      };
    }
  }

  return { ok: true, file };
}
