import { useMemo, useState } from "react";
import { List, Map as MapIcon, MapPin } from "lucide-react";
import { HubSearch, HubMap, HubBadge } from "@/hub/components/ui";
import OpportunityCard from "@/hub/components/OpportunityCard";
import { OPPORTUNITIES, type Opportunity } from "@/hub/data/opportunities";
import { toast } from "@/hooks/use-toast";

type View = "list" | "map";

const QUICK_FILTERS = [
  "Today",
  "Yesterday",
  "This Week",
  "Rear Extensions",
  "Two Storey",
  "Lofts",
  "Renovations",
  "Commercial",
  "New Builds",
] as const;

const CATEGORY_MAP: Record<string, Opportunity["category"]> = {
  "Rear Extensions": "Rear Extension",
  "Two Storey": "Two Storey",
  Lofts: "Loft",
  Renovations: "Renovation",
  Commercial: "Commercial",
  "New Builds": "New Build",
};

const HubPlanning = () => {
  const [view, setView] = useState<View>("list");
  const [active, setActive] = useState<string | null>(null);
  const [radius, setRadius] = useState(15);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const results = useMemo(() => {
    return OPPORTUNITIES.filter((o) => {
      if (o.distanceMiles > radius) return false;
      if (query && !`${o.projectType} ${o.address} ${o.postcode}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (!active) return true;
      if (active === "Today") return o.daysOld <= 1;
      if (active === "Yesterday") return o.daysOld === 1;
      if (active === "This Week") return o.daysOld <= 7;
      const cat = CATEGORY_MAP[active];
      return cat ? o.category === cat : true;
    }).map((o) => ({ ...o, saved: saved.has(o.id) }));
  }, [active, radius, query, saved]);

  const handleSave = (o: Opportunity) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(o.id) ? next.delete(o.id) : next.add(o.id);
      return next;
    });
  };

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
          <button
            className={view === "list" ? "is-active" : ""}
            onClick={() => setView("list")}
          >
            <List size={15} /> List
          </button>
          <button
            className={view === "map" ? "is-active" : ""}
            onClick={() => setView("map")}
          >
            <MapIcon size={15} /> Map
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginTop: 20, maxWidth: 480 }}>
        <HubSearch
          placeholder="Search by postcode or area…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Quick filters */}
      <div className="hub-quickfilters">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f}
            className={`hub-chip ${active === f ? "is-active" : ""}`}
            onClick={() => setActive(active === f ? null : f)}
          >
            {f}
          </button>
        ))}
        <label className="hub-chip hub-chip-radius">
          Radius: {radius} mi
          <input
            type="range"
            min={1}
            max={25}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />
        </label>
      </div>

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
