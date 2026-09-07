import exifr from "exifr";

export interface CaptureMeta {
  /** ISO timestamp the camera recorded, if present. */
  takenAt: string | null;
  lat: number | null;
  lng: number | null;
  cameraMakeModel: string | null;
}

const EMPTY: CaptureMeta = { takenAt: null, lat: null, lng: null, cameraMakeModel: null };

const plausible = (d: Date) => {
  const t = d.getTime();
  if (!Number.isFinite(t)) return false;
  // Reject obvious junk: before 2000 or more than a day in the future.
  return t > Date.parse("2000-01-01") && t < Date.now() + 86400000;
};

/**
 * Reads capture metadata (date taken, GPS, camera) from the ORIGINAL file.
 *
 * Must be called before `compressImage`, because canvas re-encoding strips
 * every EXIF tag. Never throws — returns nulls when a photo carries nothing
 * (screenshots, forwarded/recompressed images, some messaging apps).
 */
export async function readCaptureMeta(file: File): Promise<CaptureMeta> {
  try {
    const data = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      pick: [
        "DateTimeOriginal",
        "CreateDate",
        "ModifyDate",
        "latitude",
        "longitude",
        "Make",
        "Model",
      ],
    });
    if (!data) return EMPTY;

    const raw = data.DateTimeOriginal || data.CreateDate || data.ModifyDate;
    const date = raw instanceof Date ? raw : raw ? new Date(raw) : null;

    const lat = typeof data.latitude === "number" ? data.latitude : null;
    const lng = typeof data.longitude === "number" ? data.longitude : null;

    const makeModel = [data.Make, data.Model]
      .filter((v: unknown) => typeof v === "string" && v.trim())
      .join(" ")
      .trim();

    return {
      takenAt: date && plausible(date) ? date.toISOString() : null,
      lat: lat !== null && lng !== null ? lat : null,
      lng: lat !== null && lng !== null ? lng : null,
      cameraMakeModel: makeModel || null,
    };
  } catch {
    return EMPTY;
  }
}

/** Short human label for a coordinate pair. */
export const formatCoords = (lat: number, lng: number) =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const mapsLink = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
