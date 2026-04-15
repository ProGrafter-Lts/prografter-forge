import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowRight, BarChart3, Briefcase, Clock, Home, FileText, Camera } from "lucide-react";

const PhoneFrame = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="w-full max-w-[280px] bg-deep rounded-2xl overflow-hidden shadow-xl border border-white/10">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-navy/80">
        <span className="font-mono text-[10px] text-cream/50">9:41</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-teal/40" />
          <div className="w-3 h-3 rounded-full bg-teal/40" />
          <div className="w-3 h-3 rounded-full bg-teal/40" />
        </div>
      </div>
      {/* Screen content */}
      <div className="p-4 min-h-[340px]">{children}</div>
    </div>
    <p className="font-body text-secondary-text text-sm text-center">{label}</p>
  </div>
);

/* ── TRADES SCREENS ── */
const TradeDashboard = () => (
  <div className="space-y-4">
    <p className="font-heading text-cream text-lg">Dashboard</p>
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Jobs Won", val: "12" },
        { label: "Quotes Out", val: "5" },
        { label: "Earned", val: "£18.4k" },
      ].map((s) => (
        <div key={s.label} className="bg-navy/60 rounded-lg p-2 text-center">
          <p className="font-heading text-teal text-lg">{s.val}</p>
          <p className="font-mono text-[9px] text-cream/50 uppercase">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="space-y-2 mt-2">
      <p className="font-mono text-[10px] text-teal uppercase tracking-widest">New Matches</p>
      {["Kitchen Refit — SE15", "Bathroom Tiling — SW4"].map((j) => (
        <div key={j} className="flex items-center gap-2 bg-navy/40 rounded-lg p-3">
          <Briefcase className="w-4 h-4 text-teal shrink-0" />
          <span className="font-body text-cream text-xs">{j}</span>
        </div>
      ))}
    </div>
  </div>
);

const AvailableJobs = () => (
  <div className="space-y-4">
    <p className="font-heading text-cream text-lg">Available Jobs</p>
    <div className="bg-navy/40 rounded-xl p-4 space-y-3 border border-teal/20">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-body text-cream text-sm font-medium">Full Kitchen Renovation</p>
          <p className="font-mono text-[10px] text-cream/50">SE15 · Posted 2h ago</p>
        </div>
        <span className="font-mono text-[10px] bg-teal/20 text-teal px-2 py-0.5 rounded">£8-12k</span>
      </div>
      <p className="font-body text-cream/60 text-xs leading-relaxed">
        Strip out and re-fit kitchen. New units, worktops, tiling, plumbing and electrics…
      </p>
      <button className="w-full bg-teal text-cream font-heading text-sm py-2 rounded-lg">
        SUBMIT QUOTE →
      </button>
    </div>
    <div className="bg-navy/40 rounded-xl p-4 border border-white/5">
      <p className="font-body text-cream text-sm font-medium">Loft Conversion</p>
      <p className="font-mono text-[10px] text-cream/50">SW11 · Posted 5h ago</p>
    </div>
  </div>
);

const LiveTimeline = () => (
  <div className="space-y-4">
    <p className="font-heading text-cream text-lg">Project Timeline</p>
    <div className="space-y-0">
      {[
        { stage: "Strip Out", status: "done" },
        { stage: "First Fix", status: "done" },
        { stage: "Plastering", status: "active" },
        { stage: "Second Fix", status: "upcoming" },
        { stage: "Snag & Sign-off", status: "upcoming" },
      ].map((s, i) => (
        <div key={s.stage} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full border-2 ${
                s.status === "done"
                  ? "bg-teal border-teal"
                  : s.status === "active"
                  ? "bg-teal/30 border-teal animate-pulse"
                  : "bg-transparent border-cream/20"
              }`}
            />
            {i < 4 && (
              <div
                className={`w-[2px] h-8 ${
                  s.status === "done" ? "bg-teal/60" : "bg-cream/10"
                }`}
              />
            )}
          </div>
          <div className="pb-4">
            <p
              className={`font-body text-xs ${
                s.status === "done"
                  ? "text-cream/40 line-through"
                  : s.status === "active"
                  ? "text-teal font-medium"
                  : "text-cream/30"
              }`}
            >
              {s.stage}
            </p>
            {s.status === "active" && (
              <p className="font-mono text-[9px] text-teal/70 mt-0.5">In progress · Day 3</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── HOMEOWNER SCREENS ── */
const HomeownerDash = () => (
  <div className="space-y-4">
    <p className="font-heading text-cream text-lg">My Project</p>
    <div className="bg-gradient-to-br from-teal/20 to-navy/60 rounded-xl p-4 border border-teal/20">
      <p className="font-body text-cream text-sm font-medium">Kitchen Renovation</p>
      <p className="font-mono text-[10px] text-cream/50 mt-1">Stage 3 of 5 · Plastering</p>
      <div className="w-full bg-navy/60 rounded-full h-2 mt-3">
        <div className="bg-teal h-2 rounded-full" style={{ width: "60%" }} />
      </div>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-[9px] text-cream/40">60% complete</span>
        <span className="font-mono text-[9px] text-teal">On track</span>
      </div>
    </div>
    <div className="flex gap-2">
      {[
        { icon: Clock, label: "Timeline" },
        { icon: Camera, label: "Photos" },
        { icon: FileText, label: "Manual" },
      ].map((a) => (
        <div key={a.label} className="flex-1 bg-navy/40 rounded-lg p-3 flex flex-col items-center gap-1">
          <a.icon className="w-4 h-4 text-teal" />
          <span className="font-mono text-[9px] text-cream/50">{a.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const ProjectTracker = () => (
  <div className="space-y-4">
    <p className="font-heading text-cream text-lg">Project Tracker</p>
    {[
      { stage: "Strip Out", date: "Mon 7 Apr", hasPhoto: true },
      { stage: "First Fix", date: "Wed 9 Apr", hasPhoto: true },
      { stage: "Plastering", date: "Today", hasPhoto: false, active: true },
    ].map((s) => (
      <div key={s.stage} className={`bg-navy/40 rounded-lg p-3 space-y-2 ${s.active ? "border border-teal/30" : ""}`}>
        <div className="flex justify-between items-center">
          <p className="font-body text-cream text-xs font-medium">{s.stage}</p>
          <span className="font-mono text-[9px] text-cream/40">{s.date}</span>
        </div>
        {s.hasPhoto && (
          <div className="flex gap-1">
            <div className="w-12 h-10 rounded bg-navy/80 flex items-center justify-center">
              <Camera className="w-3 h-3 text-cream/30" />
            </div>
            <div className="w-12 h-10 rounded bg-navy/80 flex items-center justify-center">
              <Camera className="w-3 h-3 text-cream/30" />
            </div>
          </div>
        )}
        {s.active && (
          <p className="font-mono text-[9px] text-teal">Awaiting update…</p>
        )}
      </div>
    ))}
  </div>
);

const HomeownerManual = () => (
  <div className="space-y-4">
    <p className="font-heading text-cream text-lg">Project Manual</p>
    <div className="bg-navy/40 rounded-xl p-4 border border-teal/20 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-teal" />
        <div>
          <p className="font-body text-cream text-xs font-medium">Kitchen Renovation</p>
          <p className="font-mono text-[9px] text-cream/40">Completed 14 Apr 2026</p>
        </div>
      </div>
      <div className="h-[1px] bg-cream/10" />
      {["Materials & Suppliers", "Certificates & Warranties", "Photo Timeline", "Trade Contact Details"].map((item) => (
        <div key={item} className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal" />
          <span className="font-body text-cream/60 text-[11px]">{item}</span>
        </div>
      ))}
      <button className="w-full bg-teal/10 text-teal font-mono text-[10px] py-2 rounded-lg border border-teal/20 mt-2">
        DOWNLOAD PDF
      </button>
    </div>
  </div>
);

const PlatformPreview = () => {
  return (
    <section className="bg-deep py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">Platform Preview</span>
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

          <TabsContent value="trades">
            <div className="grid grid-cols-1 craft:grid-cols-3 gap-8 justify-items-center">
              <PhoneFrame label="Your dashboard — stats, earnings, and new job matches at a glance.">
                <TradeDashboard />
              </PhoneFrame>
              <PhoneFrame label="Browse matched jobs near you and submit quotes directly.">
                <AvailableJobs />
              </PhoneFrame>
              <PhoneFrame label="Live project timeline — update stages, log progress, get paid.">
                <LiveTimeline />
              </PhoneFrame>
            </div>
          </TabsContent>

          <TabsContent value="homeowners">
            <div className="grid grid-cols-1 craft:grid-cols-3 gap-8 justify-items-center">
              <PhoneFrame label="See your active project status, progress bar, and quick links.">
                <HomeownerDash />
              </PhoneFrame>
              <PhoneFrame label="Track every stage with daily photo updates from site.">
                <ProjectTracker />
              </PhoneFrame>
              <PhoneFrame label="Your completed project manual — materials, certs, and warranties.">
                <HomeownerManual />
              </PhoneFrame>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA link */}
        <div className="mt-14 text-center fade-up">
          <a href="#see-how-it-works" className="inline-flex items-center gap-2 font-mono text-sm text-teal hover:text-teal-hover transition-colors group">
            Full platform preview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default PlatformPreview;
