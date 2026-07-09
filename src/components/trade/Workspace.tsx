import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Accent = "teal" | "blue" | "gold" | "orange" | "green" | "purple";
type Surface = "1" | "2" | "3";
type Texture = "grid" | "crosses" | "contour" | "none";

interface WorkspaceProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: Accent;
  surface?: Surface;
  texture?: Texture;
  action?: ReactNode;
  children: ReactNode;
}

const textureClass: Record<Texture, string> = {
  grid: "blueprint-grid",
  crosses: "blueprint-crosses",
  contour: "blueprint-contour",
  none: "",
};

/**
 * Workspace — a self-contained module surface with its own accent identity,
 * navy shade and subtle blueprint texture. Purely presentational.
 */
const Workspace = ({
  id,
  icon: Icon,
  title,
  subtitle,
  accent = "teal",
  surface = "1",
  texture = "grid",
  action,
  children,
}: WorkspaceProps) => {
  return (
    <section
      id={id}
      className={`ws-surface ws-bg-${surface} ws-accent-${accent} ws-accent-bar ${textureClass[texture]} scroll-mt-24`}
    >
      <div className="relative flex flex-wrap items-start justify-between gap-4 mb-6 pl-3">
        <div className="flex items-start gap-3">
          <span className="ws-accent-bg ws-accent-ring flex items-center justify-center rounded-2xl w-12 h-12 shrink-0">
            <Icon className="w-6 h-6 ws-accent-fg" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="ws-heading text-2xl md:text-3xl">{title}</h2>
            {subtitle && (
              <p className="font-sans text-sm text-white/60 mt-1 max-w-md leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="relative pl-3">{children}</div>
    </section>
  );
};

export default Workspace;
