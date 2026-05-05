import { TrendingUp, PoundSterling, FolderKanban, Star } from "lucide-react";

interface StatsRowProps {
  jobsWon: number;
  earningsThisMonth: number;
  activeProjectCount: number;
  rating: number;
}

const StatsRow = ({ jobsWon, earningsThisMonth, activeProjectCount, rating }: StatsRowProps) => {
  const stats = [
    { label: "Total Jobs Won", value: jobsWon, icon: TrendingUp, accent: false },
    { label: "Earnings This Month", value: `£${earningsThisMonth.toLocaleString()}`, icon: PoundSterling, accent: true },
    { label: "Active Projects", value: activeProjectCount, icon: FolderKanban, accent: false },
    { label: "Rating", value: rating > 0 ? `${rating}/5` : "N/A", icon: Star, accent: false },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            backgroundColor: stat.accent ? "rgba(13,148,136,0.12)" : "rgba(255,255,255,0.04)",
            border: stat.accent ? "1px solid rgba(13,148,136,0.30)" : "1px solid rgba(255,255,255,0.08)",
          }}
          onMouseEnter={(e) => {
            if (!stat.accent) e.currentTarget.style.borderColor = "rgba(13,148,136,0.4)";
          }}
          onMouseLeave={(e) => {
            if (!stat.accent) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <stat.icon className="w-5 h-5" style={{ color: stat.accent ? "#0D9488" : "rgba(255,255,255,0.65)" }} />
          </div>
          <p
            className="font-heading"
            style={{
              fontSize: "36px",
              letterSpacing: "0.04em",
              color: stat.accent ? "#0D9488" : "#FFFFFF",
              lineHeight: 1.05,
            }}
          >
            {stat.value}
          </p>
          <p
            className="font-mono uppercase mt-1"
            style={{
              fontSize: "11px",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
