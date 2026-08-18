export type LearnerStateSummary = { next: "onboarding" | "assessment" | "path"; assessment?: { currentSequence: number } | null };
export function routeForLearnerState(state: LearnerStateSummary | null) { if (!state || state.next === "onboarding") return "onboarding" as const; return state.next === "assessment" ? "assessment" as const : "profile" as const; }
export function currentAssessmentIndex(state: LearnerStateSummary | null) { return Math.max(0, (state?.assessment?.currentSequence ?? 1) - 1); }
export function serverStateWins(authenticated: boolean, serverState: LearnerStateSummary | null, localState: unknown) { return authenticated ? serverState : localState; }
