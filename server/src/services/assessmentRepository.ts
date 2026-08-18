import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../utils/env";
import { buildHypotheses, buildPathItems, buildRecommendation, diagnosticProblems, generateObservations, type DiagnosticResponse } from "./assessmentEngine";
import { onboardingSchema, responseSchema, type StoredSession } from "./assessmentStore";

type DbClient = SupabaseClient;
function clientFor(token?: string): DbClient | null {
  if (!env.SUPABASE_URL) return null;
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;
  if (!key) return null;
  return createClient(env.SUPABASE_URL, key, token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined);
}
const err = (message: string) => new Error(message);
export function hasPersistentBackend(token?: string) { return Boolean(clientFor(token)); }

export class AssessmentRepository {
  private readonly db: DbClient;
  constructor(private readonly userId: string, token?: string) { const db = clientFor(token); if (!db) throw err("Supabase persistence is not configured"); this.db = db; }
  async updateOnboarding(onboarding: unknown) {
    const parsed = onboardingSchema.parse(onboarding);
    const { error: profileError } = await this.db.from("profiles").upsert({ id: this.userId, onboarding: parsed }, { onConflict: "id" });
    if (profileError) throw err(profileError.message);
    const { data: active } = await this.db.from("assessment_sessions").select("id").eq("user_id", this.userId).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (active) {
      const { error } = await this.db.from("assessment_sessions").update({ onboarding: parsed }).eq("id", active.id).eq("user_id", this.userId);
      if (error) throw err(error.message);
    }
    return this.me();
  }
  async start(onboarding: unknown) {
    const parsed = onboardingSchema.parse(onboarding);
    const { data: active } = await this.db.from("assessment_sessions").select("*").eq("user_id", this.userId).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (active) return this.hydrate(active.id);
    const { data: session, error } = await this.db.from("assessment_sessions").insert({ user_id: this.userId, onboarding: parsed, status: "in_progress", version: "v1-three-problem" }).select("*").single();
    if (error || !session) throw err(error?.message ?? "Unable to create assessment");
    const items = diagnosticProblems.map((problem, index) => ({ session_id: session.id, problem_slug: problem.slug, sequence: index + 1, problem_metadata: problem }));
    const inserted = await this.db.from("assessment_items").insert(items);
    if (inserted.error) throw err(inserted.error.message);
    return this.hydrate(session.id);
  }
  async hydrate(id: string): Promise<StoredSession> {
    const { data: session, error } = await this.db.from("assessment_sessions").select("*").eq("id", id).eq("user_id", this.userId).maybeSingle();
    if (error || !session) throw err("Assessment not found");
    const { data: items } = await this.db.from("assessment_items").select("*").eq("session_id", id).order("sequence");
    const ids = (items ?? []).map((item) => item.id);
    const { data: rows } = ids.length ? await this.db.from("assessment_responses").select("*, assessment_items!inner(problem_slug, sequence)").in("item_id", ids) : { data: [] as any[] };
    const responses: DiagnosticResponse[] = (rows ?? []).sort((a, b) => a.assessment_items.sequence - b.assessment_items.sequence).map((row) => ({ problemSlug: row.assessment_items.problem_slug, sequence: row.assessment_items.sequence, result: row.result, hintCount: row.hint_count, approach: row.approach, complexity: row.complexity, dataStructure: row.data_structure ?? "", code: row.code ?? "", explanation: row.explanation ?? "", durationSeconds: row.metadata?.durationSeconds ?? 0 }));
    const { data: observations } = await this.db.from("learner_observations").select("*").eq("user_id", this.userId).eq("assessment_session_id", id).order("created_at");
    const { data: hypotheses } = await this.db.from("learner_hypotheses").select("*").eq("user_id", this.userId);
    const { data: path } = await this.db.from("learning_paths").select("*").eq("user_id", this.userId).eq("assessment_session_id", id).maybeSingle(); const { data: pathItems } = path ? await this.db.from("learning_path_items").select("*").eq("path_id", path.id).order("position") : { data: [] as any[] };
    return { id, userId: this.userId, onboarding: session.onboarding, responses, observations: (observations ?? []).map((row) => ({ type: row.observation_type, evidence: row.evidence, problemSlug: row.problem_slug, skill: row.skill })), hypotheses: (hypotheses ?? []).map((row) => ({ skill: row.skill, status: row.status, confidence: Number(row.confidence), evidenceCount: row.evidence_count, evidence: row.evidence ?? [] })), recommendation: path?.recommendation, pathItems: (pathItems ?? []).map((row) => ({ position: row.position, itemType: row.item_type, title: row.title, targetSkill: row.target_skill ?? "", reason: row.reason, estimatedMinutes: row.estimated_minutes, status: row.status })), completed: session.status === "completed", createdAt: session.started_at };
  }
  async current(id: string) { const session = await this.hydrate(id); return diagnosticProblems[session.responses.length]; }
  async respond(id: string, input: unknown) {
    const response = responseSchema.parse(input); const session = await this.hydrate(id); if (session.completed) throw err("Assessment already completed");
    if (response.sequence !== session.responses.length + 1) throw err("Responses must be submitted in sequence");
    const { data: item, error: itemError } = await this.db.from("assessment_items").select("id, problem_slug, sequence").eq("session_id", id).eq("problem_slug", response.problemSlug).eq("sequence", response.sequence).maybeSingle();
    if (itemError || !item) throw err("Assessment item not found");
    const { data: existing } = await this.db.from("assessment_responses").select("id").eq("item_id", item.id).maybeSingle();
    if (existing) return { session: await this.hydrate(id), next: diagnosticProblems[response.sequence] };
    const { data: saved, error } = await this.db.from("assessment_responses").insert({ item_id: item.id, result: response.result, hint_count: response.hintCount, approach: response.approach, complexity: response.complexity, data_structure: response.dataStructure, code: response.code, explanation: response.explanation, metadata: { durationSeconds: response.durationSeconds } }).select("id").single();
    if (error || !saved) throw err(error?.message ?? "Unable to save response");
    await this.db.from("assessment_items").update({ completed_at: new Date().toISOString(), duration_seconds: response.durationSeconds }).eq("id", item.id);
    const observations = generateObservations(response);
    if (observations.length) await this.db.from("learner_observations").insert(observations.map((observation) => ({ user_id: this.userId, assessment_session_id: id, response_id: saved.id, problem_slug: observation.problemSlug, skill: observation.skill, observation_type: observation.type, evidence: observation.evidence, source: "diagnostic_response", rule: observation.type })));
    return { session: await this.hydrate(id), next: diagnosticProblems[response.sequence] };
  }
  async complete(id: string) {
    const session = await this.hydrate(id); if (session.completed && session.recommendation) return session;
    if (session.responses.length !== diagnosticProblems.length) throw err("Complete all three diagnostic problems first");
    const hypotheses = buildHypotheses(session.observations); const recommendation = buildRecommendation(hypotheses, session.onboarding.goal, session.onboarding.availability);
    for (const hypothesis of hypotheses) await this.db.from("learner_hypotheses").upsert({ user_id: this.userId, skill: hypothesis.skill, status: hypothesis.status, confidence: hypothesis.confidence, evidence_count: hypothesis.evidenceCount, evidence: hypothesis.evidence, updated_at: new Date().toISOString() }, { onConflict: "user_id,skill" });
    const goal = session.onboarding.goal === "Custom goal" ? session.onboarding.customGoal?.trim() || session.onboarding.goal : session.onboarding.goal; const { data: path, error: pathError } = await this.db.from("learning_paths").upsert({ user_id: this.userId, assessment_session_id: id, goal, timeline: session.onboarding.timeline, available_time: session.onboarding.availability, recommendation, status: "active", version: "v1" }, { onConflict: "user_id,assessment_session_id" }).select("id").single(); if (pathError || !path) throw err(pathError?.message ?? "Unable to save learning path"); const { error: pathItemsError } = await this.db.from("learning_path_items").upsert(buildPathItems(recommendation).map((item) => ({ path_id: path.id, position: item.position, item_type: item.itemType, title: item.title, target_skill: item.targetSkill, reason: item.reason, estimated_minutes: item.estimatedMinutes, status: item.status })), { onConflict: "path_id,position" }); if (pathItemsError) throw err(pathItemsError.message);
    const { error } = await this.db.from("assessment_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id).eq("user_id", this.userId);
    if (error) throw err(error.message); return this.hydrate(id);
  }
  async me() {
    const { data: savedProfile } = await this.db.from("profiles").select("onboarding").eq("id", this.userId).maybeSingle();
    const { data: session } = await this.db.from("assessment_sessions").select("id,status,onboarding,started_at").eq("user_id", this.userId).order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (!session) {
      const onboarding = savedProfile?.onboarding ?? null;
      return { user: { id: this.userId }, onboarding, assessment: null, profile: null, path: null, recommendation: null, next: onboarding?.language ? "assessment" : "onboarding" };
    }
    const hydrated = await this.hydrate(session.id); const onboarding = hydrated.onboarding ?? savedProfile?.onboarding ?? null; const next = !onboarding?.language ? "onboarding" : !hydrated.completed ? "assessment" : "path";
    return { user: { id: this.userId }, onboarding, assessment: { id: hydrated.id, status: hydrated.completed ? "completed" : "in_progress", completedItems: hydrated.responses.length, currentSequence: hydrated.responses.length + 1 }, profile: hydrated.completed ? { hypotheses: hydrated.hypotheses, observations: hydrated.observations } : null, path: hydrated.recommendation ? { recommendation: hydrated.recommendation, items: hydrated.pathItems ?? [] } : null, recommendation: hydrated.recommendation ?? null, next };
  }
}
