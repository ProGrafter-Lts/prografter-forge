// Test scenarios for QuickBuild — quick-loads sample input so trades (or you,
// during review) can preview the flow end-to-end without typing or photographing.
import { supabase } from "@/integrations/supabase/client";
import type { QuickBuildPhoto } from "@/components/trade/quickbuild/QuickBuildPhotoUploader";
import type { QuickBuildStructured } from "@/components/trade/quickbuild/QuickBuildStructuredForm";

export interface QuickBuildScenario {
  id: string;
  label: string;
  transcript: string;
  structured: QuickBuildStructured;
  photoSeeds: { url: string; caption: string }[];
}

// Picsum gives stable, deterministic placeholders by seed — great for a demo.
const pic = (seed: string, w = 1200, h = 900) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const QUICKBUILD_SCENARIOS: QuickBuildScenario[] = [
  {
    id: "rewire",
    label: "Electrical rewire (3-bed semi)",
    transcript:
      "Full rewire on a three bed semi. Existing wiring is mid-1970s rubber sheath, consumer unit is a wylex with rewireable fuses. Customer wants downlights in the kitchen and lounge, USB sockets in all bedrooms, outdoor IP rated double socket on the patio, EV charger ready cable run to the front of the house. Loft is boarded so first fix will be tight in places. Plaster is sound so chasing rather than surface trunking. Test cert and Part P notification needed.",
    structured: {
      trade_type: "electrical",
      property_type: "semi",
      property_age: "1940-1979",
      postcode: "LS6",
      hourly_rate_pounds: "55",
      day_rate_pounds: "380",
    },
    photoSeeds: [
      { url: pic("consumer-unit"), caption: "Existing Wylex consumer unit" },
      { url: pic("kitchen-ceiling"), caption: "Kitchen ceiling for downlights" },
      { url: pic("loft-cables"), caption: "Loft showing existing cable runs" },
    ],
  },
  {
    id: "bathroom",
    label: "Bathroom refurb (Victorian terrace)",
    transcript:
      "Full bathroom refurb in a Victorian end terrace. Strip out existing suite, retile walls and floor, new shower over bath with thermostatic mixer, replace cracked soil pipe boxing, swap pedestal basin for vanity unit, new chrome heated towel rail off the central heating. Floor needs ply overlay before tiling, joists are bouncy. Customer is supplying the suite themselves but I'm sourcing tiles, adhesive, grout, plumbing fittings.",
    structured: {
      trade_type: "bathroom",
      property_type: "terraced",
      property_age: "pre-1900",
      postcode: "BS3",
      hourly_rate_pounds: "48",
      day_rate_pounds: "320",
    },
    photoSeeds: [
      { url: pic("bathroom-existing"), caption: "Current bathroom suite" },
      { url: pic("bathroom-floor"), caption: "Floor where ply overlay is needed" },
    ],
  },
  {
    id: "extension",
    label: "Kitchen extension (single-storey rear)",
    transcript:
      "Single storey rear extension, four metres out across the full width, six metres wide. Cavity wall, rendered finish, two velux roof lights and bi-fold doors at the back. Knock through to existing kitchen and put a steel in. Building control sign-off needed, party wall agreement on one side, neighbour already informed. Foundations are likely two metre deep due to a mature oak fifteen metres away. Drainage will need rerouting around the slab.",
    structured: {
      trade_type: "extension",
      property_type: "detached",
      property_age: "1980-2010",
      postcode: "GU22",
      hourly_rate_pounds: "60",
      day_rate_pounds: "420",
    },
    photoSeeds: [
      { url: pic("rear-garden"), caption: "Rear elevation where extension goes" },
      { url: pic("existing-kitchen"), caption: "Existing kitchen — wall to remove" },
      { url: pic("oak-tree"), caption: "Mature oak (~15m away)" },
    ],
  },
];

export async function seedScenarioPhotos(
  userId: string,
  scenario: QuickBuildScenario,
): Promise<QuickBuildPhoto[]> {
  const out: QuickBuildPhoto[] = [];
  for (const seed of scenario.photoSeeds) {
    const blob = await fetch(seed.url).then((r) => r.blob());
    const path = `${userId}/test-${scenario.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}.jpg`;
    const { error } = await supabase.storage
      .from("quickbuild-photos")
      .upload(path, blob, { contentType: "image/jpeg" });
    if (error) {
      console.error("seed upload failed", error);
      continue;
    }
    out.push({
      path,
      previewUrl: URL.createObjectURL(blob),
      caption: seed.caption,
    });
  }
  return out;
}
