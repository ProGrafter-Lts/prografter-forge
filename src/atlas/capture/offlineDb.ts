/**
 * Atlas Phase 1 — offline-first local store (IndexedDB, no dependencies).
 *
 * Everything the surveyor captures lands here FIRST. Supabase is a
 * background mirror, never the source of truth during capture. A full
 * survey can be completed with the device in aeroplane mode.
 */

const DB_NAME = "atlas-capture";
const DB_VERSION = 1;
const FIELDS = "fields";
const PHOTOS = "photos";
const SURVEYS = "surveys";

export interface LocalField {
  id: string; // `${surveyId}|${fieldKey}`
  surveyId: string;
  fieldKey: string;
  value: any;
  capturedAt: string;
  dirty: boolean;
}

export interface LocalPhoto {
  localId: string;
  surveyId: string;
  fieldKey: string; // never empty — a photo without a field_key is a bug
  blob: Blob;
  capturedAt: string;
  uploaded: boolean;
  storagePath: string | null;
}

export interface LocalSurveyMeta {
  surveyId: string;
  propertyAddress: string | null;
  jobId: string | null;
  status: string;
  schemaVersion: string;
  updatedAt: string;
  dirty: boolean;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FIELDS)) {
        const s = db.createObjectStore(FIELDS, { keyPath: "id" });
        s.createIndex("surveyId", "surveyId");
      }
      if (!db.objectStoreNames.contains(PHOTOS)) {
        const s = db.createObjectStore(PHOTOS, { keyPath: "localId" });
        s.createIndex("surveyId", "surveyId");
        s.createIndex("surveyField", ["surveyId", "fieldKey"]);
      }
      if (!db.objectStoreNames.contains(SURVEYS)) {
        db.createObjectStore(SURVEYS, { keyPath: "surveyId" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

function all<T>(store: string, index: string | null, query: IDBValidKey | IDBKeyRange | null): Promise<T[]> {
  return openDb().then(
    (db) =>
      new Promise<T[]>((resolve, reject) => {
        const t = db.transaction(store, "readonly");
        const s = t.objectStore(store);
        const src: IDBObjectStore | IDBIndex = index ? s.index(index) : s;
        const req = query ? src.getAll(query) : src.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const localId = () =>
  (crypto?.randomUUID?.() as string) ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* ------------------------------ fields ------------------------------ */

export async function putField(surveyId: string, fieldKey: string, value: any, dirty = true) {
  const row: LocalField = {
    id: `${surveyId}|${fieldKey}`,
    surveyId,
    fieldKey,
    value,
    capturedAt: new Date().toISOString(),
    dirty,
  };
  await tx(FIELDS, "readwrite", (s) => s.put(row));
  return row;
}

export const getFields = (surveyId: string) => all<LocalField>(FIELDS, "surveyId", surveyId);
export const getDirtyFields = async (surveyId?: string) => {
  const rows = surveyId ? await getFields(surveyId) : await all<LocalField>(FIELDS, null, null);
  return rows.filter((r) => r.dirty);
};
export const markFieldClean = async (id: string) => {
  const row = await tx<LocalField>(FIELDS, "readonly", (s) => s.get(id));
  if (row) await tx(FIELDS, "readwrite", (s) => s.put({ ...row, dirty: false }));
};

/* ------------------------------ photos ------------------------------ */

export async function putPhoto(surveyId: string, fieldKey: string, blob: Blob): Promise<LocalPhoto> {
  if (!fieldKey || !fieldKey.trim()) {
    // Hard invariant: photos are always evidence for a specific field.
    throw new Error("SiteScout: refusing to store a photo with no field_key");
  }
  const row: LocalPhoto = {
    localId: localId(),
    surveyId,
    fieldKey,
    blob,
    capturedAt: new Date().toISOString(),
    uploaded: false,
    storagePath: null,
  };
  await tx(PHOTOS, "readwrite", (s) => s.put(row));
  return row;
}

export const getPhotos = (surveyId: string) => all<LocalPhoto>(PHOTOS, "surveyId", surveyId);
export const getFieldPhotos = (surveyId: string, fieldKey: string) =>
  all<LocalPhoto>(PHOTOS, "surveyField", [surveyId, fieldKey] as unknown as IDBValidKey);
export const getPendingPhotos = async (surveyId?: string) => {
  const rows = surveyId ? await getPhotos(surveyId) : await all<LocalPhoto>(PHOTOS, null, null);
  return rows.filter((r) => !r.uploaded);
};
export const markPhotoUploaded = async (lid: string, storagePath: string) => {
  const row = await tx<LocalPhoto>(PHOTOS, "readonly", (s) => s.get(lid));
  if (row) await tx(PHOTOS, "readwrite", (s) => s.put({ ...row, uploaded: true, storagePath }));
};
export const deletePhoto = (lid: string) => tx(PHOTOS, "readwrite", (s) => s.delete(lid));

/* ------------------------------ surveys ----------------------------- */

export async function putSurveyMeta(meta: LocalSurveyMeta) {
  await tx(SURVEYS, "readwrite", (s) => s.put(meta));
}
export const getSurveyMeta = (surveyId: string) => tx<LocalSurveyMeta | undefined>(SURVEYS, "readonly", (s) => s.get(surveyId));
export const listSurveyMeta = () => all<LocalSurveyMeta>(SURVEYS, null, null);
