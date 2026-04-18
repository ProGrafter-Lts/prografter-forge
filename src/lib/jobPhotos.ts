import { supabase } from "@/integrations/supabase/client";

const BUCKET = "job-photos";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Stage update / job photos used to be stored as full public URLs (the bucket
 * was public). The bucket is now private, so we need short-lived signed URLs.
 *
 * Items in `photo_urls` may now be either:
 *   - a bare bucket path like `updates/<stage_id>/<file>` or `<uid>/<file>`
 *   - a legacy public URL like `https://<ref>.supabase.co/storage/v1/object/public/job-photos/<path>`
 *
 * This helper extracts the path and returns a signed URL. If signing fails
 * (e.g. the user doesn't have RLS access), it returns null so callers can hide
 * the broken image.
 */
export const extractJobPhotoPath = (urlOrPath: string): string | null => {
  if (!urlOrPath) return null;
  const marker = "/job-photos/";
  const idx = urlOrPath.indexOf(marker);
  if (idx >= 0) return urlOrPath.slice(idx + marker.length);
  // Already a bucket path (no protocol, no leading slash)
  if (!urlOrPath.startsWith("http")) return urlOrPath.replace(/^\/+/, "");
  return null;
};

const cache = new Map<string, { url: string; expiresAt: number }>();

export const getJobPhotoSignedUrl = async (urlOrPath: string): Promise<string | null> => {
  const path = extractJobPhotoPath(urlOrPath);
  if (!path) return null;

  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;

  cache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_URL_TTL_SECONDS - 60) * 1000,
  });
  return data.signedUrl;
};

export const getJobPhotoSignedUrls = async (urlsOrPaths: string[]): Promise<string[]> => {
  const results = await Promise.all(urlsOrPaths.map(getJobPhotoSignedUrl));
  return results.filter((u): u is string => !!u);
};
