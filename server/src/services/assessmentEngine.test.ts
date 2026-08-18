import test from "node:test";
import assert from "node:assert/strict";
import { buildHypotheses, buildPathItems, buildRecommendation, generateObservations } from "./assessmentEngine";

test("generates constraint evidence from an O(n²) Two Sum approach", () => {
  const observations = generateObservations({ problemSlug: "two-sum", sequence: 2, durationSeconds: 180, result: "partial", hintCount: 0, approach: "I would use nested loops and compare every pair", complexity: "O(n^2) because of two loops" });
  assert.ok(observations.some((item) => item.type === "constraint_ignored"));
  assert.ok(observations.some((item) => item.type === "brute_force_identified"));
});

test("keeps sparse skills unknown and creates a cautious developing hypothesis", () => {
  const observations = generateObservations({ problemSlug: "two-sum", sequence: 2, durationSeconds: 180, result: "partial", hintCount: 0, approach: "nested loops", complexity: "O(n^2)" });
  const hypotheses = buildHypotheses([...observations, ...observations]);
  assert.equal(hypotheses.find((item) => item.skill === "complexity_analysis")?.status, "developing");
  assert.equal(hypotheses.find((item) => item.skill === "debugging")?.status, "unknown");
});

test("recommendation changes based on evidence", () => {
  const observations = generateObservations({ problemSlug: "two-sum", sequence: 2, durationSeconds: 180, result: "partial", hintCount: 0, approach: "nested loops", complexity: "O(n^2)" });
  const recommendation = buildRecommendation(buildHypotheses([...observations, ...observations]), "placements", "30–60 minutes/day");
  assert.equal(recommendation.targetSkill, "complexity_analysis");
  assert.match(recommendation.reason, /placements/);
});
test("builds one deterministic path item from the recommendation", () => {
  const recommendation = buildRecommendation([], "DSA mastery", "30–60 minutes/day");
  assert.deepEqual(buildPathItems(recommendation), [{
    position: 1,
    itemType: "practice",
    title: recommendation.title,
    targetSkill: recommendation.targetSkill,
    reason: recommendation.reason,
    estimatedMinutes: recommendation.estimatedMinutes,
    status: "queued",
  }]);
});
