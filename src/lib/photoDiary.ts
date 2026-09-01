export interface DiaryPhoto {
  url: string;
  caption: string;
  source: string;
  createdAt: string;
  /** Upload batch this photo belongs to (job_photos.batch_id). */
  batchId?: string | null;
  /** 'trade' | 'homeowner' */
  uploadedBy?: string;
}

export interface DiaryDay {
  key: string; // YYYY-MM-DD
  label: string; // e.g. "Today · Tue 1 Sep 2026"
  photos: DiaryPhoto[];
}

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86400000).toISOString());
  const k = dayKey(iso);
  const pretty = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (k === today) return `Today · ${pretty}`;
  if (k === yesterday) return `Yesterday · ${pretty}`;
  return pretty;
};

/** Group photos into newest-first days, photos newest-first within each day. */
export function groupByDay(photos: DiaryPhoto[]): DiaryDay[] {
  const map = new Map<string, DiaryPhoto[]>();
  for (const p of photos) {
    const k = dayKey(p.createdAt);
    const arr = map.get(k);
    if (arr) arr.push(p);
    else map.set(k, [p]);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, items]) => ({
      key,
      label: dayLabel(items[0].createdAt),
      photos: items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }));
}

export interface DiaryBatch {
  /** batch_id when present, otherwise a synthetic key */
  key: string;
  batchId: string | null;
  caption: string;
  uploadedBy: string;
  createdAt: string;
  photos: DiaryPhoto[];
}

const BATCH_WINDOW_MS = 10 * 60 * 1000;

/**
 * Group photos of a single day into upload batches: photos sharing a
 * `batchId` belong together; legacy rows without one fall back to
 * "same uploader within 10 minutes".
 */
export function groupIntoBatches(photos: DiaryPhoto[]): DiaryBatch[] {
  const withId = new Map<string, DiaryPhoto[]>();
  const legacy: DiaryPhoto[] = [];

  for (const p of photos) {
    if (p.batchId) {
      const arr = withId.get(p.batchId);
      if (arr) arr.push(p);
      else withId.set(p.batchId, [p]);
    } else {
      legacy.push(p);
    }
  }

  const batches: DiaryBatch[] = [];

  for (const [batchId, items] of withId) {
    batches.push(makeBatch(batchId, batchId, items));
  }

  const sortedLegacy = [...legacy].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let current: DiaryPhoto[] = [];
  const flush = () => {
    if (!current.length) return;
    batches.push(makeBatch(`legacy-${current[0].createdAt}-${current[0].url}`, null, current));
    current = [];
  };
  for (const p of sortedLegacy) {
    const prev = current[current.length - 1];
    if (
      prev &&
      prev.uploadedBy === p.uploadedBy &&
      new Date(p.createdAt).getTime() - new Date(prev.createdAt).getTime() < BATCH_WINDOW_MS
    ) {
      current.push(p);
    } else {
      flush();
      current.push(p);
    }
  }
  flush();

  return batches.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function makeBatch(key: string, batchId: string | null, items: DiaryPhoto[]): DiaryBatch {
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return {
    key,
    batchId,
    caption: sorted.find((p) => p.caption && p.caption !== "Daily site photo")?.caption || sorted[0].caption,
    uploadedBy: sorted[0].uploadedBy || "trade",
    createdAt: sorted[0].createdAt,
    photos: sorted,
  };
}
