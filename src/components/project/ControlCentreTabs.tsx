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
    className="flex md:flex-wrap gap-2 overflow-x-auto md:overflow-visible rounded-2xl border border-white/10 bg-card/60 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] uppercase tracking-wide px-4 py-2.5 rounded-xl border transition-all ${
            isActive
              ? "bg-teal-500 text-[#08172a] border-teal-400 shadow-[0_0_22px_-6px_rgba(20,184,166,0.8)]"
              : "border-white/20 bg-white/[0.07] text-foreground/85 hover:text-foreground hover:bg-white/[0.12] hover:border-teal-400/50"
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
