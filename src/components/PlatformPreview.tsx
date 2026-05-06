import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowRight,
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Bell,
  PoundSterling,
  UserCircle,
  Settings,
  TrendingUp,
  Star,
  Home,
  SearchCheck,
  BookOpen,
  Leaf,
  Camera,
  FileText,
  BadgeCheck,
} from "lucide-react";

/* ── Browser-frame mockup matching the real logged-in dashboard ── */
const BrowserFrame = ({
  children,
  caption,
  sidebar,
}: {
  children: React.ReactNode;
  caption: string;
  sidebar: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3">
    <div
      className="rounded-xl overflow-hidden border shadow-2xl"
      style={{
        backgroundColor: "#0F2238",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ backgroundColor: "#0B1A2C", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div
          className="ml-3 px-2 py-0.5 rounded text-[9px] font-mono"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}
        >
          prografter.co.uk/dashboard
        </div>
      </div>

      {/* App body: sidebar + content */}
      <div className="flex min-h-[360px]">
        {/* Sidebar */}
        <div
          className="w-[110px] shrink-0 py-4 px-2 border-r"
          style={{ backgroundColor: "#1B3A5C", borderColor: "rgba(255,255,255,0.08)" }}
        >
          {sidebar}
        </div>
        {/* Main */}
        <div className="flex-1 p-4 overflow-hidden">{children}</div>
      </div>
    </div>
    <p className="font-body text-secondary-text text-sm text-center max-w-[320px] mx-auto">
      {caption}
    </p>
  </div>
);

const SidebarNav = ({
  items,
  active,
}: {
  items: { icon: any; label: string }[];
  active: string;
}) => (
  <div className="space-y-1">
    {items.map((item) => {
      const isActive = item.label === active;
      return (
        <div
          key={item.label}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{
            backgroundColor: isActive ? "rgba(13,148,136,0.18)" : "transparent",
            color: isActive ? "#5EEAD4" : "rgba(255,255,255,0.65)",
          }}
        >
          <item.icon className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono text-[9px] uppercase tracking-wider truncate">
            {item.label}
          </span>
        </div>
      );
    })}
  </div>
);

/* ── Stat tile matching StatsRow.tsx ── */
const StatTile = ({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: any;
  value: string;
  label: string;
  accent?: boolean;
}) => (
  <div
    className="rounded-xl p-3"
    style={{
      backgroundColor: accent ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.04)",
      border: accent
        ? "1px solid rgba(13,148,136,0.30)"
        : "1px solid rgba(255,255,255,0.08)",
    }}
  >
    <Icon
      className="w-3.5 h-3.5 mb-1.5"
      style={{ color: accent ? "#0D9488" : "rgba(255,255,255,0.65)" }}
    />
    <p
      className="font-heading"
      style={{
        fontSize: "20px",
        lineHeight: 1.05,
        color: accent ? "#5EEAD4" : "#FFFFFF",
      }}
    >
      {value}
    </p>
    <p
      className="font-mono uppercase mt-0.5"
      style={{
        fontSize: "8px",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.65)",
      }}
    >
      {label}
    </p>
  </div>
);

/* ── TRADE DASHBOARD ── */
const TRADE_NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Briefcase, label: "Jobs" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Bell, label: "Alerts" },
  { icon: PoundSterling, label: "Earnings" },
  { icon: UserCircle, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

const TradeDashboardMockup = () => (
  <div className="space-y-3">
    <div>
      <h4 className="font-heading text-white text-base leading-none">Welcome back, Tom</h4>
      <p className="font-mono text-[9px] text-white/65 mt-1">Plumbing & Heating · SE15</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <StatTile icon={TrendingUp} value="12" label="Jobs Won" />
      <StatTile icon={PoundSterling} value="£18.4k" label="This Month" accent />
      <StatTile icon={FolderKanban} value="3" label="Active" />
      <StatTile icon={Star} value="4.9/5" label="Rating" />
    </div>
  </div>
);

const TradeJobsMockup = () => (
  <div className="space-y-2">
    <h4 className="font-heading text-white text-base leading-none mb-3">Available Jobs</h4>
    {[
      { title: "Full Kitchen Renovation", loc: "SE15 · 2h ago", budget: "£8–12k", hot: true },
      { title: "Bathroom Re-tile", loc: "SW4 · 5h ago", budget: "£2–3k" },
      { title: "Loft Conversion", loc: "SW11 · 1d ago", budget: "£25k+" },
    ].map((j) => (
      <div
        key={j.title}
        className="rounded-lg p-2.5"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: j.hot
            ? "1px solid rgba(13,148,136,0.40)"
            : "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="font-body text-white text-[11px] font-medium truncate">{j.title}</p>
            <p className="font-mono text-[8px] text-white/50 mt-0.5">{j.loc}</p>
          </div>
          <span
            className="font-mono text-[8px] px-1.5 py-0.5 rounded shrink-0"
            style={{ backgroundColor: "rgba(13,148,136,0.18)", color: "#5EEAD4" }}
          >
            {j.budget}
          </span>
        </div>
      </div>
    ))}
  </div>
);

const TradeEarningsMockup = () => (
  <div className="space-y-3">
    <h4 className="font-heading text-white text-base leading-none">Earnings</h4>
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: "rgba(13,148,136,0.12)",
        border: "1px solid rgba(13,148,136,0.30)",
      }}
    >
      <p className="font-mono text-[8px] uppercase tracking-wider text-white/65">Year to date</p>
      <p className="font-heading text-2xl mt-1" style={{ color: "#5EEAD4" }}>
        £42,180
      </p>
      <p className="font-mono text-[9px] text-white/65 mt-0.5">+18% vs last year</p>
    </div>
    <div className="space-y-1.5">
      {[
        { stage: "Smith — Kitchen", amt: "£3,400", paid: true },
        { stage: "Jones — Bathroom", amt: "£1,850", paid: true },
        { stage: "Patel — En-suite", amt: "£2,200", paid: false },
      ].map((p) => (
        <div
          key={p.stage}
          className="flex justify-between items-center rounded-lg p-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span className="font-body text-white text-[10px]">{p.stage}</span>
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-white text-[11px]">{p.amt}</span>
            {p.paid ? (
              <BadgeCheck className="w-3 h-3" style={{ color: "#0D9488" }} />
            ) : (
              <span className="font-mono text-[8px] text-white/50">pending</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── HOMEOWNER DASHBOARD ── */
const HOMEOWNER_NAV = [
  { icon: LayoutDashboard, label: "Overview" },
  { icon: FolderKanban, label: "Projects" },
  { icon: SearchCheck, label: "Quotes" },
  { icon: Leaf, label: "Green Grants" },
  { icon: BookOpen, label: "Manual" },
  { icon: UserCircle, label: "Profile" },
  { icon: Settings, label: "Settings" },
];

const HomeownerDashboardMockup = () => (
  <div className="space-y-3">
    <div>
      <h4 className="font-heading text-white text-base leading-none">Welcome back, Sarah</h4>
      <p className="font-mono text-[9px] text-white/65 mt-1">My Projects</p>
    </div>
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: "rgba(13,148,136,0.12)",
        border: "1px solid rgba(13,148,136,0.30)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-body text-white text-[11px] font-medium">Kitchen Renovation</p>
        <span className="font-mono text-[8px]" style={{ color: "#5EEAD4" }}>
          On track
        </span>
      </div>
      <p className="font-mono text-[8px] text-white/65 mb-2">Stage 3 of 5 · Plastering</p>
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="h-full rounded-full" style={{ width: "60%", backgroundColor: "#0D9488" }} />
      </div>
      <p className="font-mono text-[8px] text-white/50 mt-1.5">60% complete · Day 14</p>
    </div>
    <div className="grid grid-cols-2 gap-2">
      <StatTile icon={SearchCheck} value="3" label="Quotes In" accent />
      <StatTile icon={BookOpen} value="1" label="Manuals" />
    </div>
  </div>
);

const HomeownerQuotesMockup = () => (
  <div className="space-y-2">
    <h4 className="font-heading text-white text-base leading-none mb-3">Quotes Received</h4>
    {[
      { name: "Tom — Plumbing & Heating", price: "£9,200", verdict: "fair", rating: "4.9" },
      { name: "Mike — KitchenWorks", price: "£11,800", verdict: "high", rating: "4.7" },
      { name: "Sara — FitOut Ltd", price: "£8,950", verdict: "fair", rating: "5.0" },
    ].map((q) => (
      <div
        key={q.name}
        className="rounded-lg p-2.5"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="font-body text-white text-[10px] font-medium truncate">{q.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-2.5 h-2.5" style={{ color: "#5EEAD4" }} />
              <span className="font-mono text-[8px] text-white/65">{q.rating}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-heading text-white text-[11px]">{q.price}</p>
            <span
              className="font-mono text-[7px] uppercase tracking-wider"
              style={{ color: q.verdict === "fair" ? "#5EEAD4" : "rgba(255,200,100,0.9)" }}
            >
              {q.verdict}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const HomeownerManualMockup = () => (
  <div className="space-y-3">
    <h4 className="font-heading text-white text-base leading-none">Project Manual</h4>
    <div
      className="rounded-xl p-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(13,148,136,0.30)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-4 h-4" style={{ color: "#5EEAD4" }} />
        <div className="min-w-0">
          <p className="font-body text-white text-[11px] font-medium truncate">
            Kitchen Renovation
          </p>
          <p className="font-mono text-[8px] text-white/50">Completed 14 Apr 2026</p>
        </div>
      </div>
      <div className="space-y-1.5 mt-3">
        {[
          { icon: FileText, label: "Materials & Suppliers" },
          { icon: BadgeCheck, label: "Certificates & Warranties" },
          { icon: Camera, label: "Photo Timeline" },
          { icon: UserCircle, label: "Trade Contact Details" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <item.icon className="w-2.5 h-2.5" style={{ color: "#0D9488" }} />
            <span className="font-body text-white/80 text-[9px]">{item.label}</span>
          </div>
        ))}
      </div>
      <div
        className="mt-3 text-center font-mono text-[9px] py-1.5 rounded-lg"
        style={{
          backgroundColor: "rgba(13,148,136,0.18)",
          color: "#5EEAD4",
          border: "1px solid rgba(13,148,136,0.30)",
        }}
      >
        DOWNLOAD PDF
      </div>
    </div>
  </div>
);

const PlatformPreview = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            Platform Preview
          </span>
        </div>

        {/* Heading */}
        <h2 className="font-heading text-cream text-[48px] craft:text-[64px] leading-none mb-12">
          The Platform. See It In Action.
        </h2>

        {/* Tabs */}
        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="bg-navy/40 border border-cream/10 p-1 mb-10">
            <TabsTrigger
              value="trades"
              className="font-heading text-sm tracking-wide px-6 py-2 text-cream/50 data-[state=active]:bg-teal data-[state=active]:text-cream data-[state=active]:shadow-none"
            >
              FOR TRADES
            </TabsTrigger>
            <TabsTrigger
              value="homeowners"
              className="font-heading text-sm tracking-wide px-6 py-2 text-cream/50 data-[state=active]:bg-teal data-[state=active]:text-cream data-[state=active]:shadow-none"
            >
              FOR HOMEOWNERS
            </TabsTrigger>
          </TabsList>

          <p className="font-body italic text-[12px] text-cream/70 mb-8 -mt-4">
            Real dashboard preview. Stats shown are illustrative until your first jobs flow through.
          </p>

          <TabsContent value="trades">
            <div className="grid grid-cols-1 craft:grid-cols-3 gap-8">
              <BrowserFrame
                caption="Your dashboard — stats, earnings, and new job matches at a glance."
                sidebar={<SidebarNav items={TRADE_NAV} active="Dashboard" />}
              >
                <TradeDashboardMockup />
              </BrowserFrame>
              <BrowserFrame
                caption="Browse matched jobs near you and submit quotes directly."
                sidebar={<SidebarNav items={TRADE_NAV} active="Jobs" />}
              >
                <TradeJobsMockup />
              </BrowserFrame>
              <BrowserFrame
                caption="Track every payment — commission, what you keep, paid status."
                sidebar={<SidebarNav items={TRADE_NAV} active="Earnings" />}
              >
                <TradeEarningsMockup />
              </BrowserFrame>
            </div>
          </TabsContent>

          <TabsContent value="homeowners">
            <div className="grid grid-cols-1 craft:grid-cols-3 gap-8">
              <BrowserFrame
                caption="See your active project status, progress bar, and quick links."
                sidebar={<SidebarNav items={HOMEOWNER_NAV} active="Overview" />}
              >
                <HomeownerDashboardMockup />
              </BrowserFrame>
              <BrowserFrame
                caption="Compare quotes side-by-side with fairness scoring built in."
                sidebar={<SidebarNav items={HOMEOWNER_NAV} active="Quotes" />}
              >
                <HomeownerQuotesMockup />
              </BrowserFrame>
              <BrowserFrame
                caption="Your completed project manual — materials, certs, and warranties."
                sidebar={<SidebarNav items={HOMEOWNER_NAV} active="Manual" />}
              >
                <HomeownerManualMockup />
              </BrowserFrame>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA link */}
        <div className="mt-14 text-center fade-up">
          <a
            href="#see-how-it-works"
            className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors group"
          >
            Full platform preview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
