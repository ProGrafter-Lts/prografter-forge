/**
 * Atlas Phase 1 — background sync engine.
 *
 * Pushes locally captured fields and photos to the backend whenever a
 * connection is available. Nothing in the capture UI ever awaits the
 * network: failures simply leave the row dirty for the next attempt.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  getDirtyFields,
  getPendingPhotos,
  markFieldClean,
  markPhotoUploaded,
  getFields,
  getPhotos,
  putField,
} from "./offlineDb";
import { ATLAS_SURVEY_SCHEMA_VERSION } from "./atlas-survey-schema";

const BUCKET = "atlas-evidence";

export interface SyncState {
  online: boolean;
  syncing: boolean;
  pendingFields: number;
  pendingPhotos: number;
  lastSyncedAt: string | null;
  error: string | null;
}

type Listener = (s: SyncState) => void;

let state: SyncState = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  syncing: false,
  pendingFields: 0,
  pendingPhotos: 0,
  lastSyncedAt: null,
  error: null,
};

const listeners = new Set<Listener>();

function emit(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function subscribeSync(l: Listener) {
  listeners.add(l);
  l(state);
  return () => listeners.delete(l);
}

export const getSyncState = () => state;

export async function refreshPendingCounts(surveyId?: string) {
  const [f, p] = await Promise.all([getDirtyFields(surveyId), getPendingPhotos(surveyId)]);
  emit({ pendingFields: f.length, pendingPhotos: p.length });
}

let running = false;

export async function syncNow(surveyId?: string): Promise<void> {
  if (running) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    emit({ online: false });
    await refreshPendingCounts(surveyId);
    return;
  }
  running = true;
  emit({ syncing: true, error: null, online: true });

  try {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      // Signed out on site — keep everything local, retry later.
      emit({ syncing: false });
      running = false;
      await refreshPendingCounts(surveyId);
      return;
    }

    // 1. Fields
    for (const row of await getDirtyFields(surveyId)) {
      const { error } = await (supabase as any)
        .from("atlas_survey_fields")
        .upsert(
          {
            survey_id: row.surveyId,
            field_key: row.fieldKey,
            value: row.value ?? null,
            captured_at: row.capturedAt,
          },
          { onConflict: "survey_id,field_key" },
        );
      if (error) throw error;
      await markFieldClean(row.id);
    }

    // 2. Photos — upload blob then register the row against its field_key
    for (const p of await getPendingPhotos(surveyId)) {
      if (!p.fieldKey) continue; // invariant guard
      const path = `${p.surveyId}/capture/${p.fieldKey}/${p.localId}.jpg`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, p.blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { error: rowErr } = await (supabase as any).from("atlas_field_photos").upsert(
        {
          survey_id: p.surveyId,
          field_key: p.fieldKey,
          storage_path: path,
          local_id: p.localId,
          captured_at: p.capturedAt,
        },
        { onConflict: "survey_id,local_id" },
      );
      if (rowErr) throw rowErr;
      await markPhotoUploaded(p.localId, path);
    }

    // 3. Stamp the schema version on the survey record
    if (surveyId) {
      await (supabase as any)
        .from("atlas_surveys")
        .update({ schema_version: ATLAS_SURVEY_SCHEMA_VERSION })
        .eq("id", surveyId);
    }

    emit({ lastSyncedAt: new Date().toISOString() });
  } catch (e: any) {
    emit({ error: e?.message ?? "Sync failed — will retry" });
  } finally {
    running = false;
    emit({ syncing: false });
    await refreshPendingCounts(surveyId);
  }
}

/** Pull any server-side values into the local store (first load on a new device). */
export async function hydrateFromServer(surveyId: string) {
  const [localFields, localPhotos] = await Promise.all([getFields(surveyId), getPhotos(surveyId)]);
  const known = new Set(localFields.map((f) => f.fieldKey));
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const { data } = await (supabase as any)
    .from("atlas_survey_fields")
    .select("field_key, value")
    .eq("survey_id", surveyId);
  for (const r of (data || []) as any[]) {
    if (!known.has(r.field_key)) await putField(surveyId, r.field_key, r.value, false);
  }
  void localPhotos;
}

let started = false;

/** Wire up online/interval triggers once per app session. */
export function startSyncLoop(surveyId?: string) {
  void refreshPendingCounts(surveyId);
  if (started) return () => {};
  started = true;
  const onOnline = () => {
    emit({ online: true });
    void syncNow(surveyId);
  };
  const onOffline = () => emit({ online: false });
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  const timer = window.setInterval(() => void syncNow(surveyId), 20000);
  void syncNow(surveyId);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    window.clearInterval(timer);
    started = false;
  };
}
