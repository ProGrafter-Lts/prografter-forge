import { TrendingUp, PoundSterling, FolderKanban, Star } from "lucide-react";

interface StatsRowProps {
  jobsWon: number;
  earningsThisMonth: number;
  activeProjectCount: number;
  rating: number;
}

const StatsRow = ({ jobsWon, earningsThisMonth, activeProjectCount, rating }: StatsRowProps) => {
  const stats = [
    { label: "Total Jobs Won", value: jobsWon, icon: TrendingUp, color: "text-secondary" },
    { label: "Earnings This Month", value: `£${earningsThisMonth.toLocaleString()}`, icon: PoundSterling, color: "text-secondary" },
    { label: "Active Projects", value: activeProjectCount, icon: FolderKanban, color: "text-primary" },
    { label: "Rating", value: rating > 0 ? `${rating}/5` : "N/A", icon: Star, color: "text-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-2xl p-5 border border-primary/10 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <p className="font-heading text-2xl text-primary">{stat.value}</p>
          <p className="font-mono text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsRow;
