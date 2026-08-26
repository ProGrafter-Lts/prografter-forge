import { useEffect, useState } from "react";
import type { Agent } from "@/lib/agentRegistry";

/**
 * Dual-state agent avatar. Shows the `site` portrait while the takeoff is
 * calculating and the `clean` portrait once verified, cross-fading between
 * them. Falls back to a monogram tile when the image file is not present.
 */
const AgentAvatar = ({
  agent,
  state,
  size = 64,
  active = false,
}: {
  agent: Agent;
  state: "clean" | "site";
  size?: number;
  active?: boolean;
}) => {
  const src = agent.avatars[state];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden shrink-0 transition-all duration-500"
      style={{
        width: size,
        height: size,
        border: `1px solid ${active ? "#1AC2BA" : "rgba(255,255,255,0.14)"}`,
        boxShadow: active ? "0 0 0 3px rgba(26,194,186,0.18)" : "none",
        background: "linear-gradient(160deg, rgba(26,194,186,0.22), rgba(255,255,255,0.04))",
      }}
    >
      {!failed ? (
        <img
          key={src}
          src={src}
          alt={`${agent.name} — ${agent.roleBadge}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover animate-fade-in transition-all duration-500"
          style={{
            filter: state === "site" ? "saturate(1.1) contrast(1.05)" : "none",
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span
            className="font-heading font-bold text-white/85"
            style={{ fontSize: Math.round(size / 2.6) }}
          >
            {agent.name.slice(0, 1)}
          </span>
        </div>
      )}
      <span
        className="absolute bottom-1 right-1 rounded-full transition-colors duration-500"
        style={{
          width: 9,
          height: 9,
          backgroundColor: state === "site" ? "#F59E0B" : "#1AC2BA",
          boxShadow: "0 0 0 2px rgba(11,27,48,0.9)",
        }}
        aria-hidden
      />
    </div>
  );
};

export default AgentAvatar;
