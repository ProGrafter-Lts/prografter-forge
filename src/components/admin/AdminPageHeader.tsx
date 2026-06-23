import { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

/**
 * Uniform page header used across every admin section page.
 * Sits directly under the global AdminNav and gives all pages the same
 * title band, spacing and container width for a consistent dashboard feel.
 */
const AdminPageHeader = ({ title, subtitle, actions }: AdminPageHeaderProps) => (
  <div className="border-b border-navy/10 bg-white/60">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-heading text-navy text-2xl sm:text-3xl leading-tight">{title}</h1>
        {subtitle && (
          <p className="font-body text-secondary-text text-sm mt-1.5 max-w-2xl leading-snug">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  </div>
);

export default AdminPageHeader;
