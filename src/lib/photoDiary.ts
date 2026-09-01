export interface DiaryPhoto {
  url: string;
  caption: string;
  source: string;
  createdAt: string;
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
