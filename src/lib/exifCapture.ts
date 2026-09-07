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

export interface CaptureDiagnostic {
  fileName: string;
  fileType: string;
  fileSizeKb: number;
  /** Every EXIF/TIFF/GPS tag name the parser could see in the file. */
  tagsFound: string[];
  /** Raw date-ish tags, as strings. */
  rawDates: Record<string, string>;
  hasGps: boolean;
  makeModel: string | null;
  parsed: CaptureMeta;
  error: string | null;
}

/**
 * Temporary diagnostic: reports exactly what (if anything) a chosen file
 * carries, so we can tell "stripped by the sender" from "reader failing".
 */
export async function diagnoseCaptureMeta(file: File): Promise<CaptureDiagnostic> {
  const base = {
    fileName: file.name,
    fileType: file.type || "unknown",
    fileSizeKb: Math.round(file.size / 1024),
  };
  try {
    const all = await exifr.parse(file, true);
    const parsed = await readCaptureMeta(file);
    const rawDates: Record<string, string> = {};
    for (const k of ["DateTimeOriginal", "CreateDate", "ModifyDate", "GPSDateStamp", "GPSTimeStamp"]) {
      const v = all?.[k];
      if (v !== undefined && v !== null) rawDates[k] = String(v);
    }
    return {
      ...base,
      tagsFound: all ? Object.keys(all) : [],
      rawDates,
      hasGps: typeof all?.latitude === "number" && typeof all?.longitude === "number",
      makeModel: [all?.Make, all?.Model].filter(Boolean).join(" ") || null,
      parsed,
      error: all ? null : "No metadata block found in file",
    };
  } catch (e) {
    return {
      ...base,
      tagsFound: [],
      rawDates: {},
      hasGps: false,
      makeModel: null,
      parsed: EMPTY,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Short human label for a coordinate pair. */
export const formatCoords = (lat: number, lng: number) =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const mapsLink = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
