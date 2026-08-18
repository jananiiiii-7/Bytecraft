import { describe, expect, it } from "vitest";
import { currentAssessmentIndex, routeForLearnerState, serverStateWins } from "./learnerState";
describe("server-authoritative learner state", () => {
  it("routes onboarding", () => expect(routeForLearnerState({ next: "onboarding" })).toBe("onboarding"));
  it("routes active assessment", () => expect(routeForLearnerState({ next: "assessment", assessment: { currentSequence: 2 } })).toBe("assessment"));
  it("routes completed state to profile", () => expect(routeForLearnerState({ next: "path" })).toBe("profile"));
  it("resumes after completed sequence", () => expect(currentAssessmentIndex({ next: "assessment", assessment: { currentSequence: 3 } })).toBe(2));
  it("defaults to first item", () => expect(currentAssessmentIndex(null)).toBe(0));
  it("server beats local for authenticated users", () => { const server = { next: "assessment" as const }; expect(serverStateWins(true, server, { next: "path" })).toBe(server); });
  it("local is allowed only for unauthenticated users", () => { const local = { stage: "onboarding" }; expect(serverStateWins(false, null, local)).toBe(local); });
  it("does not invent state when server is unavailable", () => expect(serverStateWins(true, null, { stage: "assessment" })).toBeNull());
});
