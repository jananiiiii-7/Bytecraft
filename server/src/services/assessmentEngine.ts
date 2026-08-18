export type DiagnosticResponse = {
  problemSlug: string;
  sequence: number;
  durationSeconds: number;
  result: "solved" | "partial" | "stuck";
  hintCount: number;
  approach: string;
  complexity: string;
  dataStructure?: string;
  code?: string;
  explanation?: string;
};
export type Observation = { type: string; evidence: string; problemSlug: string; skill: string };
export type Hypothesis = { skill: string; status: "unknown" | "developing" | "strong"; confidence: number; evidenceCount: number; evidence: string[] };
export type Recommendation = { title: string; targetSkill: string; reason: string; evidence: string[]; estimatedMinutes: number };

export const diagnosticProblems = [
  { slug: "array-traversal", title: "Find the largest value", sequence: 1, difficulty: "Easy", prompt: "Given an array of integers, return the largest value. Explain your approach and its time complexity.", skills: ["programming_fundamentals", "implementation", "problem_decomposition"] },
  { slug: "two-sum", title: "Two Sum", sequence: 2, difficulty: "Easy", prompt: "Given an array and a target, return the indices of two values that add to the target. Consider the constraints, brute force, complexity, and a data structure that improves the approach.", skills: ["complexity_analysis", "data_structure_selection", "optimization"] },
  { slug: "valid-anagram", title: "Valid Anagram", sequence: 3, difficulty: "Easy", prompt: "Given two strings, decide whether one is an anagram of the other. Explain how your approach transfers the lookup idea to a different problem.", skills: ["pattern_recognition", "transfer", "debugging"] },
] as const;

function has(text: string, ...terms: string[]) { const lower = text.toLowerCase(); return terms.some((term) => lower.includes(term)); }

export function generateObservations(response: DiagnosticResponse): Observation[] {
  const observations: Observation[] = [];
  const approach = `${response.approach} ${response.complexity} ${response.dataStructure ?? ""}`;
  if (response.sequence === 1) {
    if (response.result === "solved" && response.code?.trim()) observations.push({ type: "implementation_strong", evidence: "Learner reported a solved fundamentals problem and supplied an implementation.", problemSlug: response.problemSlug, skill: "implementation" });
    if (response.approach.trim()) observations.push({ type: "reasoning_before_coding", evidence: "Learner provided an explicit approach before submitting the attempt.", problemSlug: response.problemSlug, skill: "problem_decomposition" });
  }
  if (response.sequence === 2) {
    if (has(approach, "o(n)", "linear", "hash", "map", "dictionary", "set")) observations.push({ type: "optimization_identified", evidence: "Learner connected Two Sum to linear lookup or a hash-based data structure.", problemSlug: response.problemSlug, skill: "optimization" });
    else if (has(approach, "o(n^2)", "nested", "two loops", "brute")) observations.push({ type: "constraint_ignored", evidence: "Learner described repeated searching or O(n²) without a clear feasibility check.", problemSlug: response.problemSlug, skill: "complexity_analysis" });
    if (has(response.approach, "brute", "nested", "compare every")) observations.push({ type: "brute_force_identified", evidence: "Learner explicitly described the brute-force approach before considering an improvement.", problemSlug: response.problemSlug, skill: "problem_decomposition" });
  }
  if (response.sequence === 3) {
    if (has(approach, "map", "hash", "frequency", "count", "set")) observations.push({ type: "pattern_transfer", evidence: "Learner applied lookup or frequency-count reasoning to a differently worded problem.", problemSlug: response.problemSlug, skill: "transfer" });
    if (response.result === "solved" && response.code?.trim()) observations.push({ type: "implementation_strong", evidence: "Learner supplied an implementation for the transfer problem and marked it solved.", problemSlug: response.problemSlug, skill: "implementation" });
  }
  return observations;
}

export function buildHypotheses(observations: Observation[]): Hypothesis[] {
  const skills = ["programming_fundamentals", "problem_decomposition", "complexity_analysis", "optimization", "pattern_recognition", "data_structure_selection", "implementation", "debugging", "transfer"];
  return skills.map((skill) => {
    const evidence = observations.filter((item) => item.skill === skill);
    const positive = evidence.filter((item) => ["optimization_identified", "pattern_transfer", "implementation_strong", "reasoning_before_coding", "brute_force_identified"].includes(item.type));
    const negative = evidence.filter((item) => item.type === "constraint_ignored");
    const count = evidence.length;
    const status = count >= 2 && negative.length > 0 ? "developing" : positive.length >= 2 ? "strong" : "unknown";
    const confidence = count === 0 ? 0 : Math.min(0.95, 0.45 + count * 0.12);
    return { skill, status, confidence, evidenceCount: count, evidence: evidence.map((item) => item.evidence) };
  });
}

export function buildRecommendation(hypotheses: Hypothesis[], goal: string, minutesPerDay: string): Recommendation {
  const complexity = hypotheses.find((item) => item.skill === "complexity_analysis");
  const transfer = hypotheses.find((item) => item.skill === "transfer");
  const optimization = hypotheses.find((item) => item.skill === "optimization");
  if (complexity && complexity.evidenceCount > 0 && complexity.status !== "strong") return { title: "Constraint-first problem solving", targetSkill: "complexity_analysis", reason: `Your assessment showed repeated-search thinking before a clear feasibility check. For your goal of ${goal || "improving problem solving"}, start by practicing constraints before choosing a data structure. Your ${minutesPerDay || "available"} schedule supports a short focused session.`, evidence: complexity.evidence, estimatedMinutes: 30 };
  if (transfer?.status !== "strong") return { title: "Hash-map pattern recognition", targetSkill: "pattern_recognition", reason: "You can work through an array problem, but the transfer problem did not yet show consistent lookup-pattern recognition. Two short hash-map problems are the next useful probe.", evidence: transfer?.evidence ?? [], estimatedMinutes: 30 };
  return { title: "Broaden pattern transfer", targetSkill: "transfer", reason: "Your current responses show promising implementation and lookup reasoning. The next step is to practice the same ideas in a less familiar surface form.", evidence: optimization?.evidence ?? [], estimatedMinutes: 45 };
}

export type LearningPathItem = {
  position: number;
  itemType: string;
  title: string;
  targetSkill: string;
  reason: string;
  estimatedMinutes: number;
  status: string;
};

export function buildPathItems(recommendation: Recommendation): LearningPathItem[] {
  return [{
    position: 1,
    itemType: "practice",
    title: recommendation.title,
    targetSkill: recommendation.targetSkill,
    reason: recommendation.reason,
    estimatedMinutes: recommendation.estimatedMinutes,
    status: "queued",
  }];
}
