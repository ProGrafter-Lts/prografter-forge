/**
 * Minimal circular progress ring — used across Atlas for overall and section
 * completion. Presentation-only; no logic.
 */
interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: "teal" | "amber" | "muted";
}

export default function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  label,
  sublabel,
  tone = "teal",
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;
  const color =
    tone === "amber" ? "#F59E0B" : tone === "muted" ? "rgba(255,255,255,0.35)" : "#2DD4BF";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: "stroke-dasharray 500ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-white text-lg leading-none">{label ?? `${pct}%`}</span>
        {sublabel && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-1">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
