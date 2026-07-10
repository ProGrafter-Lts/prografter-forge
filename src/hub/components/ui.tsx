import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Search, ChevronDown } from "lucide-react";

/* ============================================================
   ProGrafter Planning Hub — reusable component library
   Every primitive shares the .hub-* design tokens so spacing,
   radius and colour stay consistent across future pages.
   ============================================================ */

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

/* ---------------- Button ---------------- */
type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";
interface HubButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: ReactNode;
}
export const HubButton = forwardRef<HTMLButtonElement, HubButtonProps>(
  ({ variant = "primary", size = "md", icon, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx("hub-btn", `hub-btn-${variant}`, size === "sm" && "hub-btn-sm", className)}
      {...rest}
    >
      {icon}
      {children}
    </button>
  ),
);
HubButton.displayName = "HubButton";

/* ---------------- Card ---------------- */
interface HubCardProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
}
export const HubCard = ({ children, className, padded = true, interactive }: HubCardProps) => (
  <div
    className={cx("hub-card", padded && "hub-card-pad", interactive && "hub-card-interactive", className)}
  >
    {children}
  </div>
);

/* ---------------- Stat card ---------------- */
interface HubStatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "navy" | "teal" | "amber" | "rose";
  hint?: string;
}
const STAT_ACCENT: Record<string, { bg: string; fg: string }> = {
  navy: { bg: "#eef3f8", fg: "#1b3a5c" },
  teal: { bg: "#e6f4f2", fg: "#0d9488" },
  amber: { bg: "#fdf3e3", fg: "#b8791b" },
  rose: { bg: "#fdecec", fg: "#c0392b" },
};
export const HubStatCard = ({ label, value, icon, accent = "navy", hint }: HubStatCardProps) => {
  const a = STAT_ACCENT[accent];
  return (
    <HubCard interactive>
      <div className="flex items-start justify-between">
        <div>
          <div className="hub-stat-label">{label}</div>
          <div className="hub-stat-value">{value}</div>
        </div>
        <span className="hub-stat-icon" style={{ background: a.bg, color: a.fg }}>
          {icon}
        </span>
      </div>
      {hint && <div style={{ fontSize: 12, color: "#8a97a8", marginTop: 12 }}>{hint}</div>}
    </HubCard>
  );
};

/* ---------------- Status badge ---------------- */
type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "navy";
export const HubBadge = ({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) => (
  <span className={cx("hub-badge", `hub-badge-${tone}`)}>
    {dot && <span className="hub-badge-dot" />}
    {children}
  </span>
);

/* ---------------- Tag ---------------- */
export const HubTag = ({ children }: { children: ReactNode }) => (
  <span className="hub-tag">{children}</span>
);

/* ---------------- Search bar ---------------- */
export const HubSearch = ({
  placeholder = "Search…",
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={cx("hub-search", className)}>
    <Search size={17} />
    <input className="hub-input" placeholder={placeholder} {...rest} />
  </div>
);

/* ---------------- Dropdown (presentational trigger) ---------------- */
export const HubDropdown = ({ label }: { label: string }) => (
  <button className="hub-btn hub-btn-secondary hub-btn-sm" type="button">
    {label}
    <ChevronDown size={15} />
  </button>
);

/* ---------------- Form field ---------------- */
export const HubField = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <label style={{ display: "block" }}>
    <span className="hub-field-label">{label}</span>
    {children}
  </label>
);
export const HubInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className="hub-input" {...props} />
);
export const HubTextarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className="hub-textarea" rows={4} {...props} />
);

/* ---------------- Table ---------------- */
export const HubTable = ({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) => (
  <div className="hub-table-wrap">
    <table className="hub-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

/* ---------------- Map container ---------------- */
export const HubMap = ({ height = 320, label }: { height?: number; label?: ReactNode }) => (
  <div className="hub-map" style={{ height }}>
    <div className="hub-map-grid" />
    {label && <div className="hub-map-overlay">{label}</div>}
  </div>
);

/* ---------------- Kanban card ---------------- */
export const HubKanbanCard = ({ children }: { children: ReactNode }) => (
  <div className="hub-kanban-card">{children}</div>
);

/* ---------------- Empty state ---------------- */
export const HubEmpty = ({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="hub-empty">
    <span className="hub-empty-icon">{icon}</span>
    <div style={{ fontWeight: 700, color: "#17233a", fontSize: 15 }}>{title}</div>
    {description && <p style={{ maxWidth: 340, marginTop: 6, fontSize: 14 }}>{description}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

/* ---------------- Section header ---------------- */
export const HubSection = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section style={{ marginTop: 36 }}>
    <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
      <h2 className="hub-section-title">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);
