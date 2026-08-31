import { describe, expect, it } from "vitest";
import { classifyInspection } from "../../supabase/functions/_shared/inspection-classify";

describe("Building Control inspection classifier", () => {
  it("CLEAR — empty table, explicit clear language", () => {
    const r = classifyInspection({
      requiredActions: [],
      previousRequiredActions: [],
      narrative:
        "Site inspection carried out at first floor level. No adverse comments. Next inspection Pre Plasterboard.",
    });
    expect(r.classification).toBe("CLEAR");
    expect(r.outstanding).toHaveLength(0);
  });

  it("HOLD — inspector unable to assess", () => {
    const r = classifyInspection({
      requiredActions: [],
      previousRequiredActions: [],
      narrative:
        "Truss package not received so unable to check the structure. Until the details are received a full check cannot be carried out.",
    });
    expect(r.classification).toBe("HOLD");
    expect(r.unableToAssess.length).toBeGreaterThan(0);
    expect(r.outstanding.length).toBeGreaterThan(0);
  });

  it("MIXED — resolved and open items in the same report", () => {
    const r = classifyInspection({
      requiredActions: ["Noggins to be added to first floor joists"],
      previousRequiredActions: [],
      narrative: [
        "Damaged tile now replaced.",
        "Joists hangers provided, fully nailed.",
        "Noggins to be added at mid span.",
        "The external wall insulation is not continuous, please address as this may be a damp risk.",
      ].join("\n"),
    });
    expect(r.classification).toBe("MIXED");
    expect(r.resolvedItems.length).toBeGreaterThan(0);
    expect(r.openItems.length).toBeGreaterThan(0);
    expect(r.outstanding).toContain("Noggins to be added to first floor joists");
  });

  it("HOLD — silence is never a pass", () => {
    const r = classifyInspection({ narrative: "Attended site. Inspection undertaken at 10:15." });
    expect(r.classification).toBe("HOLD");
  });
});
