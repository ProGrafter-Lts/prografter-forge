import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a short-lived signed URL for a private insurance certificate.
 *
 * Storage RLS restricts reads to:
 *   - the trade who uploaded the file (their own folder), or
 *   - any user with the `admin` role (for verification).
 *
 * @param pathOrUrl  Either the storage path (preferred, e.g. "<uid>/file.pdf")
 *                   or a legacy public URL stored before the lockdown.
 * @param expiresIn  Seconds until the signed URL expires. Defaults to 1 hour.
 */
export async function getInsuranceCertSignedUrl(
  pathOrUrl: string | null | undefined,
  expiresIn = 60 * 60,
): Promise<string | null> {
  if (!pathOrUrl) return null;

  // Legacy rows may contain a full public URL. Extract the storage path.
  let path = pathOrUrl;
  const marker = "/insurance-certs/";
  const idx = pathOrUrl.indexOf(marker);
  if (idx !== -1) path = pathOrUrl.slice(idx + marker.length);

  const { data, error } = await supabase.storage
    .from("insurance-certs")
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Failed to sign insurance cert URL", error);
    return null;
  }
  return data.signedUrl;
}
