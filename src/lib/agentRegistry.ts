/**
 * ProGrafter Multi-Agent Command Center — agent registry.
 *
 * Sandbox-only: drives /sitescout-sandbox. Each agent carries dual avatar
 * states — `site` while the takeoff is calculating, `clean` once verified.
 */

import ianClean from "@/assets/agents/ian-clean.png.asset.json";
import ianSite from "@/assets/agents/ian-site.png.asset.json";
import amyClean from "@/assets/agents/amy-clean.png.asset.json";
import amySite from "@/assets/agents/amy-site.png.asset.json";
import rubyClean from "@/assets/agents/ruby-clean.png.asset.json";
import rubySite from "@/assets/agents/ruby-site.png.asset.json";
import calebClean from "@/assets/agents/caleb-clean.png.asset.json";
import calebSite from "@/assets/agents/caleb-site.png.asset.json";
import meganClean from "@/assets/agents/megan-clean.png.asset.json";
import meganSite from "@/assets/agents/megan-site.png.asset.json";

export type AgentId =
  | "lee"
  | "ian"
  | "caleb"
  | "megan"
  | "ruby"
  | "amy"
  | "elizabeth"
  | "sharon";

/** BoQ phase an agent owns. Lee owns none directly (he signs off the whole job). */
export type AgentPhase =
  | "Substructure"
  | "Superstructure"
  | "MEP"
  | "Finishes"
  | "Commercial"
  | "Compliance"
  | "Logistics"
  | "Command";

export interface Agent {
  id: AgentId;
  name: string;
  title: string;
  roleBadge: string;
  speciality: string;
  motto?: string;
  phase: AgentPhase;
  avatars: { clean: string; site: string };
}

const REAL_AVATARS: Partial<Record<AgentId, { clean: string; site: string }>> = {
  ian: { clean: ianClean.url, site: ianSite.url },
  amy: { clean: amyClean.url, site: amySite.url },
  ruby: { clean: rubyClean.url, site: rubySite.url },
  caleb: { clean: calebClean.url, site: calebSite.url },
  megan: { clean: meganClean.url, site: meganSite.url },
};

const avatars = (id: AgentId) =>
  REAL_AVATARS[id] ?? {
    clean: `/avatars/agents/${id}-clean.png`,
    site: `/avatars/agents/${id}-site.png`,
  };

export const AGENTS: Agent[] = [
  {
    id: "lee",
    name: "Lee",
    title: "Founder & Master Site Director",
    roleBadge: "Master Builder & Operations",
    speciality:
      "Overall job orchestration, cross-trade verification, and final quote sign-off.",
    motto: "If it's not to spec, it's not getting built. Details matter.",
    phase: "Command",
    avatars: avatars("lee"),
  },
  {
    id: "ian",
    name: "Ian",
    title: "Groundworks, Civils & Substructure Lead",
    roleBadge: "Civils & Heavy Substructure",
    speciality:
      "NHBC 4.2 clay tree depth triggers (1.8m dig), 35% soil bulking, grab wagon axle payload math, concrete trench footings.",
    phase: "Substructure",
    avatars: avatars("ian"),
  },
  {
    id: "caleb",
    name: "Caleb",
    title: "Superstructure, Masonry & Roof Lead",
    roleBadge: "Masonry, Structure & Roof",
    speciality:
      "Metric (60/m²) vs Imperial (52/m²) brick counts, Part L 100mm PIR cavity insulation, catnic steel lintels, true roof pitch geometry.",
    phase: "Superstructure",
    avatars: avatars("caleb"),
  },
  {
    id: "megan",
    name: "Megan",
    title: "Building Services & Electrics (MEP) Lead",
    roleBadge: "Electrical & Mechanical (MEP)",
    speciality:
      "BS 7671 18th Edition AMD3 metal consumer unit upgrades, first/second-fix power and lighting point schedules.",
    phase: "MEP",
    avatars: avatars("megan"),
  },
  {
    id: "ruby",
    name: "Ruby",
    title: "Drylining, Plastering & Finishes Lead",
    roleBadge: "Drylining, Skim & Joinery",
    speciality:
      "12.5mm plasterboard sheet counts (2.4x1.2m), 2-coat Thistle multi-finish skim areas, skirting and architrave linear runs.",
    phase: "Finishes",
    avatars: avatars("ruby"),
  },
  {
    id: "amy",
    name: "Amy",
    title: "Commercial Lead & Principal QS",
    roleBadge: "Commercial & Procurement",
    speciality:
      "Baseline merchant price scraping, RFQ tender packaging (Packs A–E), trade margin protection.",
    phase: "Commercial",
    avatars: avatars("amy"),
  },
  {
    id: "elizabeth",
    name: "Elizabeth",
    title: "Quality Assurance & Safety Lead",
    roleBadge: "QA & Building Regs Compliance",
    speciality:
      "Cross-trade building control compliance checks (Part A, C, E, H, L, P), pre-pour inspection sign-offs.",
    phase: "Compliance",
    avatars: avatars("elizabeth"),
  },
  {
    id: "sharon",
    name: "Sharon",
    title: "Site Logistics & Handover Specialist",
    roleBadge: "Logistics, Scheduling & Welfare",
    speciality:
      "Material delivery sequencing, site storage & grab access coordination, client handover sign-off certificates.",
    phase: "Logistics",
    avatars: avatars("sharon"),
  },
];

export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a])) as Record<
  AgentId,
  Agent
>;
