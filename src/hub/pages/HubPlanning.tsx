import { useMemo, useState } from "react";
import { List, Map as MapIcon, MapPin, SlidersHorizontal, X } from "lucide-react";
import { HubSearch, HubMap, HubBadge } from "@/hub/components/ui";
import OpportunityCard from "@/hub/components/OpportunityCard";
import {
  OPPORTUNITIES,
  PROJECT_TYPES,
  PLANNING_STATUSES,
  ALL_TRADES,
  opportunityScore,
  type Opportunity,
} from "@/hub/data/opportunities";
import { toast } from "@/hooks/use-toast";

type View = "list" | "map";
type DateWindow = "any" | "today" | "week" | "month";

const DATE_OPTIONS: { value: DateWindow; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

const SCORE_OPTIONS = [0, 60, 70, 80, 90];

const HubPlanning = () => {
  const [view, setView] = useState<View>("list");
  const [radius, setRadius] = useState(15);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // filter state
  const [statuses, setStatuses] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [trades, setTrades] = useState<Set<string>>(new Set());
  const [dateWindow, setDateWindow] = useState<DateWindow>("any");
  const [minScore, setMinScore] = useState(0);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) =>
    set((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  const activeFilterCount =
    statuses.size + types.size + trades.size + (dateWindow !== "any" ? 1 : 0) + (minScore > 0 ? 1 : 0);

  const clearFilters = () => {
    setStatuses(new Set());
    setTypes(new Set());
    setTrades(new Set());
    setDateWindow("any");
    setMinScore(0);
  };

  // Flat list of active filters as removable pills
  const activePills: { key: string; label: string; onRemove: () => void }[] = [
    ...[...statuses].map((s) => ({ key: `st-${s}`, label: s, onRemove: () => toggle(setStatuses, s) })),
    ...[...types].map((t) => ({ key: `ty-${t}`, label: t, onRemove: () => toggle(setTypes, t) })),
    ...[...trades].map((t) => ({ key: `tr-${t}`, label: t, onRemove: () => toggle(setTrades, t) })),
    ...(dateWindow !== "any"
      ? [{ key: "dw", label: DATE_OPTIONS.find((d) => d.value === dateWindow)!.label, onRemove: () => setDateWindow("any") }]
      : []),
    ...(minScore > 0
      ? [{ key: "ms", label: `Score ${minScore}%+`, onRemove: () => setMinScore(0) }]
      : []),
  ];

  const results = useMemo(() => {
    return OPPORTUNITIES.filter((o) => {
      if (o.distanceMiles > radius) return false;
      if (
        query &&
        !`${o.projectType} ${o.address} ${o.postcode} ${o.planningRef}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      if (statuses.size && !statuses.has(o.planningStatus)) return false;
      if (types.size && !types.has(o.category)) return false;
      if (trades.size && !o.tradesRequired.some((t) => trades.has(t))) return false;
      if (dateWindow === "today" && o.daysOld > 1) return false;
      if (dateWindow === "week" && o.daysOld > 7) return false;
      if (dateWindow === "month" && o.daysOld > 31) return false;
      if (minScore > 0 && opportunityScore(o) < minScore) return false;
      return true;
    }).map((o) => ({ ...o, saved: saved.has(o.id) }));
  }, [radius, query, statuses, types, trades, dateWindow, minScore, saved]);

  const handleSave = (o: Opportunity) => toggle(setSaved as never, o.id);

  const handleAdd = (o: Opportunity) => {
    toast({ title: "Added to pipeline", description: `${o.projectType} is now in New Opportunity.` });
  };

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="hub-page-title">Planning Hub</h1>
          <p className="hub-page-sub">Where your next job comes from.</p>
        </div>
        <div className="hub-viewtoggle">
          <button className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>
            <List size={15} /> List
          </button>
          <button className={view === "map" ? "is-active" : ""} onClick={() => setView("map")}>
            <MapIcon size={15} /> Map
          </button>
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="hub-plan-toolbar">
        <HubSearch
          placeholder="Search by postcode, town or planning reference…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="hub-plan-search"
        />
        <button
          className={`hub-chip hub-filter-toggle ${showFilters ? "is-active" : ""}`}
          onClick={() => setShowFilters((s) => !s)}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && <span className="hub-filter-count">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Radius */}
      <div className="hub-quickfilters">
        <label className="hub-chip hub-chip-radius">
          Radius: {radius} mi
          <input
            type="range"
            min={1}
            max={50}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </label>
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="hub-active-pills">
          {activePills.map((p) => (
            <button key={p.key} className="hub-active-pill" onClick={p.onRemove}>
              {p.label}
              <X size={13} />
            </button>
          ))}
          <button className="hub-active-pill-clear" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="hub-filter-panel">
          <div className="hub-filter-group">
            <span className="hub-filter-label">
              Planning Status
              {statuses.size > 0 && <span className="hub-filter-group-count">{statuses.size}</span>}
            </span>
            <div className="hub-filter-chips">
              {PLANNING_STATUSES.map((s) => (
                <button
                  key={s}
                  className={`hub-chip ${statuses.has(s) ? "is-active" : ""}`}
                  onClick={() => toggle(setStatuses, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-filter-group">
            <span className="hub-filter-label">
              Project Type
              {types.size > 0 && <span className="hub-filter-group-count">{types.size}</span>}
            </span>
            <div className="hub-filter-chips">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  className={`hub-chip ${types.has(t) ? "is-active" : ""}`}
                  onClick={() => toggle(setTypes, t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-filter-group">
            <span className="hub-filter-label">
              Trade Required
              {trades.size > 0 && <span className="hub-filter-group-count">{trades.size}</span>}
            </span>
            <div className="hub-filter-chips">
              {ALL_TRADES.map((t) => (
                <button
                  key={t}
                  className={`hub-chip ${trades.has(t) ? "is-active" : ""}`}
                  onClick={() => toggle(setTrades, t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-filter-group">
            <span className="hub-filter-label">Date Submitted</span>
            <div className="hub-filter-chips">
              {DATE_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  className={`hub-chip ${dateWindow === d.value ? "is-active" : ""}`}
                  onClick={() => setDateWindow(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-filter-group">
            <span className="hub-filter-label">Opportunity Score</span>
            <div className="hub-filter-chips">
              {SCORE_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`hub-chip ${minScore === s ? "is-active" : ""}`}
                  onClick={() => setMinScore(s)}
                >
                  {s === 0 ? "Any score" : `${s}%+`}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-filter-footer">
            <button
              className="hub-filter-clear"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              <X size={14} /> Clear all
            </button>
            <button className="hub-btn hub-btn-primary" onClick={() => setShowFilters(false)}>
              Show {results.length} result{results.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}


      {/* Results */}
      {view === "list" ? (
        <div className="hub-opp-list">
          <div className="hub-opp-count">
            {results.length} opportunit{results.length === 1 ? "y" : "ies"} within {radius} miles
          </div>
          {results.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              onSave={handleSave}
              onAddToPipeline={handleAdd}
            />
          ))}
          {results.length === 0 && (
            <div className="hub-empty">
              <span className="hub-empty-icon">
                <MapPin size={22} />
              </span>
              <div style={{ fontWeight: 700, color: "#17233a" }}>No opportunities match</div>
              <p style={{ fontSize: 14 }}>Try widening the radius or clearing a filter.</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <HubMap
            height={480}
            label={
              <div className="flex flex-col items-center gap-3">
                <span className="hub-empty-icon">
                  <MapPin size={22} />
                </span>
                <div style={{ fontWeight: 700, color: "#17233a" }}>
                  {results.length} pins within {radius} miles
                </div>
                <HubBadge tone="navy" dot>
                  Interactive map coming soon
                </HubBadge>
              </div>
            }
          />
        </div>
      )}
    </>
  );
};

export default HubPlanning;
