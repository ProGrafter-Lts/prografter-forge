import type { LucideIcon } from "lucide-react";

export interface ControlCentreTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: ControlCentreTab[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Horizontal tab bar for the homeowner Project Control Centre. Pure presentation
 * — the parent owns the active-tab state and renders the matching panel.
 */
const ControlCentreTabs = ({ tabs, active, onChange }: Props) => (
  <div
    role="tablist"
    aria-label="Project sections"
    className="flex flex-wrap gap-2 bg-card rounded-2xl p-2 border border-border"
  >
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = tab.id === active;
      return (
        <button
          key={tab.id}
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(tab.id)}
          className={`inline-flex items-center gap-1.5 font-mono text-xs px-3.5 py-2 rounded-xl transition-colors ${
            isActive
              ? "bg-secondary text-secondary-foreground shadow-sm"
              : "text-muted-foreground hover:text-primary hover:bg-muted"
          }`}
        >
          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default ControlCentreTabs;
