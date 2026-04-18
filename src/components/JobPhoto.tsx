import { useEffect, useState } from "react";
import { getJobPhotoSignedUrl } from "@/lib/jobPhotos";

interface JobPhotoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  /** Either a bucket path or a legacy public URL — both are resolved to a signed URL. */
  source: string;
  /** Fallback rendered while loading or if signing fails. */
  placeholder?: React.ReactNode;
}

/**
 * Renders an image stored in the (private) job-photos bucket by resolving the
 * stored value to a short-lived signed URL.
 */
const JobPhoto = ({ source, placeholder, alt = "", className, ...rest }: JobPhotoProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    getJobPhotoSignedUrl(source).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [source]);

  if (failed) {
    return <div className={className} aria-label="Photo unavailable">{placeholder ?? null}</div>;
  }
  if (!url) {
    return <div className={`${className ?? ""} bg-muted animate-pulse`}>{placeholder ?? null}</div>;
  }
  return <img src={url} alt={alt} className={className} {...rest} />;
};

export default JobPhoto;
