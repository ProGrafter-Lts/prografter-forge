import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import AtlasShell from "./AtlasShell";
import { useSiteScoutAccess } from "@/lib/siteScoutAccess";

/**
 * Closed-testing gate: only the SiteScout test account gets the live product.
 * Everyone else sees the same "Coming Soon" state shown elsewhere in the app.
 */
export default function SiteScoutGate({ children }: { children: ReactNode }) {
  const { loading, allowed } = useSiteScoutAccess();

  if (loading) {
    return (
      <AtlasShell>
        <div className="p-8 font-mono text-sm text-muted-foreground">Loading…</div>
      </AtlasShell>
    );
  }

  if (!allowed) {
    return (
      <AtlasShell>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-6">
            <Compass className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-heading text-2xl text-foreground mb-3">SiteScout is coming soon</h1>
          <p className="font-mono text-sm text-muted-foreground mb-8">
            Guided site surveys are in closed testing. We'll open access to trade accounts once
            field testing is complete.
          </p>
          <Link
            to="/dashboard/trade"
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-3 font-mono text-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </AtlasShell>
    );
  }

  return <>{children}</>;
}
