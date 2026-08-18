import test from "node:test";
import assert from "node:assert/strict";
import { completeSession, currentItem, recordResponse, startSession } from "./assessmentStore";

test("assessment advances in sequence and rejects incomplete completion", () => {
  const session = startSession("test-user-a", { goal: "DSA mastery", timeline: "3 months", availability: "30–60 minutes/day", language: "Python", selfAssessment: "starting" });
  assert.equal(currentItem("test-user-a", session.id)?.slug, "array-traversal");
  assert.throws(() => completeSession("test-user-a", session.id), /three diagnostic/);
  recordResponse("test-user-a", session.id, { problemSlug: "array-traversal", sequence: 1, durationSeconds: 60, result: "solved", hintCount: 0, approach: "Scan once", complexity: "O(n)", code: "max = nums[0]" });
  assert.equal(currentItem("test-user-a", session.id)?.slug, "two-sum");
  assert.throws(() => recordResponse("test-user-a", session.id, { problemSlug: "valid-anagram", sequence: 3, durationSeconds: 60, result: "stuck", hintCount: 0, approach: "", complexity: "" }), /sequence/);
});

test("different evidence produces a different first recommendation", () => {
  const session = startSession("test-user-b", { goal: "placements", timeline: "6 months", availability: "30–60 minutes/day", language: "JavaScript", selfAssessment: "familiar" });
  recordResponse("test-user-b", session.id, { problemSlug: "array-traversal", sequence: 1, durationSeconds: 60, result: "solved", hintCount: 0, approach: "Scan once", complexity: "O(n)", code: "max = nums[0]" });
  recordResponse("test-user-b", session.id, { problemSlug: "two-sum", sequence: 2, durationSeconds: 60, result: "solved", hintCount: 0, approach: "Use a hash map", complexity: "O(n)", dataStructure: "hash map", code: "" });
  recordResponse("test-user-b", session.id, { problemSlug: "valid-anagram", sequence: 3, durationSeconds: 60, result: "solved", hintCount: 0, approach: "Use a map to count", complexity: "O(n)", dataStructure: "map", code: "" });
  const result = completeSession("test-user-b", session.id);
  assert.equal(result.recommendation?.targetSkill, "pattern_recognition");
  assert.equal(result.observations.some((item) => item.type === "pattern_transfer"), true);
});
test("duplicate responses and completion are idempotent", () => {
  const session = startSession("test-user-idempotent", { goal: "DSA mastery", timeline: "3 months", availability: "30–60 minutes/day", language: "Python", selfAssessment: "starting" });
  const response = { problemSlug: "array-traversal", sequence: 1, durationSeconds: 60, result: "solved" as const, hintCount: 0, approach: "Scan once", complexity: "O(n)", code: "max = nums[0]" };
  recordResponse("test-user-idempotent", session.id, response);
  recordResponse("test-user-idempotent", session.id, response);
  assert.equal(session.responses.length, 1);
  recordResponse("test-user-idempotent", session.id, { ...response, problemSlug: "two-sum", sequence: 2 });
  recordResponse("test-user-idempotent", session.id, { ...response, problemSlug: "valid-anagram", sequence: 3 });
  const first = completeSession("test-user-idempotent", session.id);
  const second = completeSession("test-user-idempotent", session.id);
  assert.equal(second, first);
});
