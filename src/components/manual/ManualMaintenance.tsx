import { Wrench } from "lucide-react";

const SCHEDULES: Record<string, { title: string; items: { task: string; frequency: string }[] }[]> = {
  "Extension": [
    {
      title: "Structural & External",
      items: [
        { task: "External render/masonry visual check", frequency: "Every 2 years" },
        { task: "Pointing and repairs as needed", frequency: "As required" },
        { task: "Gutters clear", frequency: "Twice yearly" },
        { task: "Flashings check", frequency: "Annually" },
        { task: "UPVC/aluminium windows clean and lubricate", frequency: "Annually" },
      ],
    },
  ],
  "New Build": [
    {
      title: "Structural & External",
      items: [
        { task: "External render/masonry visual check", frequency: "Every 2 years" },
        { task: "Pointing and repairs as needed", frequency: "As required" },
        { task: "Roof tile/slate check", frequency: "Annually" },
        { task: "Gutters clear", frequency: "Twice yearly" },
        { task: "Flashings check", frequency: "Annually" },
        { task: "UPVC/aluminium windows clean and lubricate", frequency: "Annually" },
      ],
    },
  ],
  "Electrical": [
    {
      title: "Electrical Systems",
      items: [
        { task: "EICR (Electrical Installation Condition Report)", frequency: "Every 10 years" },
        { task: "Test smoke alarms, replace batteries", frequency: "Monthly / annually" },
        { task: "RCD test (press test button)", frequency: "Monthly" },
      ],
    },
  ],
  "Boiler": [
    {
      title: "Heating Systems",
      items: [
        { task: "Annual service by Gas Safe engineer", frequency: "Annually" },
        { task: "Bleed radiators", frequency: "Each autumn" },
        { task: "Check boiler pressure (1–1.5 bar)", frequency: "Monthly" },
      ],
    },
  ],
  "Heating": [
    {
      title: "Heating Systems",
      items: [
        { task: "Annual service by Gas Safe engineer", frequency: "Annually" },
        { task: "Bleed radiators", frequency: "Each autumn" },
        { task: "Check boiler pressure (1–1.5 bar)", frequency: "Monthly" },
      ],
    },
  ],
  "Roofing": [
    {
      title: "Roof Maintenance",
      items: [
        { task: "Post-storm tile check", frequency: "After storms" },
        { task: "Gutter clearance", frequency: "Twice yearly" },
        { task: "Ridge and hip mortar check", frequency: "Every 3 years" },
      ],
    },
  ],
};

const DEFAULT_SCHEDULE = [
  {
    title: "General Maintenance",
    items: [
      { task: "Visual inspection of all completed works", frequency: "Annually" },
      { task: "Check sealants and joints", frequency: "Annually" },
      { task: "Clean and maintain all fittings", frequency: "As needed" },
    ],
  },
];

const ManualMaintenance = ({ jobType }: { jobType: string }) => {
  // Match job type to schedules
  const matchedSchedules: { title: string; items: { task: string; frequency: string }[] }[] = [];

  for (const [key, schedules] of Object.entries(SCHEDULES)) {
    if (jobType.toLowerCase().includes(key.toLowerCase())) {
      matchedSchedules.push(...schedules);
    }
  }

  const displaySchedules = matchedSchedules.length > 0 ? matchedSchedules : DEFAULT_SCHEDULE;

  return (
    <section id="maintenance" className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="font-heading text-primary text-xl mb-4 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-secondary" />
        6. Maintenance Schedule
      </h2>

      <p className="font-mono text-xs text-muted-foreground mb-4">
        Auto-generated based on your project type: <span className="text-secondary">{jobType}</span>
      </p>

      {displaySchedules.map((group, i) => (
        <div key={i} className="mb-4 last:mb-0">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map((item, j) => (
              <div key={j} className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="font-mono text-xs text-foreground">{item.task}</span>
                <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                  {item.frequency}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ManualMaintenance;
