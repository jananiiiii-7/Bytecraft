import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, LockKeyhole, Sparkles, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { LearnerState } from "@/contexts/AuthContext";
import { currentAssessmentIndex, routeForLearnerState } from "@/lib/learnerState";
import "./assessment.css";

type Onboarding = { goal: string; customGoal?: string; timeline: string; availability: string; language: string; selfAssessment: string };
type Response = { problemSlug: string; sequence: number; result: "solved" | "partial" | "stuck"; hintCount: number; approach: string; complexity: string; dataStructure: string; code: string; explanation: string; durationSeconds: number };
type Profile = { strengths: string[]; developing: string[]; unknown: string[]; evidence: string[]; recommendation: { title: string; targetSkill: string; reason: string; minutes: number }; path: string[] };
function profileFromLearnerState(state: LearnerState | null): Profile | null {
  const recommendation = state?.recommendation as Record<string, unknown> | null;
  if (!state?.profile || !recommendation) return null;
  const hypotheses = state.profile.hypotheses ?? [];
  return { strengths: hypotheses.filter((item) => item.status === "strong").map((item) => String(item.skill)), developing: hypotheses.filter((item) => item.status === "developing").map((item) => String(item.skill)), unknown: hypotheses.filter((item) => item.status === "unknown").map((item) => String(item.skill)), evidence: (state.profile.observations ?? []).map((item) => String(item.evidence ?? "Observed during assessment.")), recommendation: { title: String(recommendation.title ?? "Your next move"), targetSkill: String(recommendation.targetSkill ?? recommendation.target_skill ?? "problem solving"), reason: String(recommendation.reason ?? "Continue with your recommended practice."), minutes: Number(recommendation.minutes ?? recommendation.estimatedMinutes ?? 30) }, path: (state.path?.items ?? []).map((item) => String(item.title ?? "Recommended practice")) };
}
const problems = [
  { slug: "array-traversal", title: "Find the largest value", time: "About 5 minutes", prompt: "Given an array of integers, return the largest value. Explain your approach and its time complexity.", hint: "Start with input, output, and how many times you need to inspect each value." },
  { slug: "two-sum", title: "Two Sum", time: "About 7 minutes", prompt: "Given an array and a target, return the indices of two values that add to the target. Consider constraints, brute force, complexity, and a data structure that improves the approach.", hint: "Before coding, ask what happens when the input grows to 100,000 values." },
  { slug: "valid-anagram", title: "Valid Anagram", time: "About 5 minutes", prompt: "Given two strings, decide whether one is an anagram of the other. Explain how your approach transfers the lookup idea to a different problem.", hint: "What information would you count or remember while scanning the strings?" },
] as const;
const goals = ["Software engineering placements", "Internship interviews", "DSA mastery", "Competitive programming", "General programming improvement", "Custom goal"];
const languages = ["JavaScript / TypeScript", "Python", "Java", "C++"];
const key = "bytecraft-v1-assessment-state";
function readState() { try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; } }
async function post(path: string, body: unknown) {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (data.session?.access_token) headers.Authorization = "Bearer " + data.session.access_token;
  const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
  const result = await res.json().catch(() => null);
  if (!res.ok) throw new Error(result?.error ?? "The server could not save this change.");
  return result;
}
async function put(path: string, body: unknown) { const { data } = await supabase.auth.getSession(); const headers: Record<string, string> = { "Content-Type": "application/json" }; if (data.session?.access_token) headers.Authorization = "Bearer " + data.session.access_token; const res = await fetch(path, { method: "PUT", headers, body: JSON.stringify(body) }); return res.ok ? await res.json() : null; }

export function AuthDialog({ onClose, initialMode = "signin" }: { onClose: () => void; initialMode?: "signin" | "signup" | "forgot" | "reset" }) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage("");
    if (!isSupabaseConfigured) { setMessage("Authentication is not configured for this environment."); return; }
    if (mode === "signup" && password !== confirmation) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage(/confirm/i.test(error.message) ? "Check your email to confirm your account." : /invalid/i.test(error.message) ? "Email or password is incorrect." : "We could not sign you in. Please try again."); else onClose();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setMessage(/already/i.test(error.message) ? "This email is already registered. Try signing in instead." : "We could not create your account. Please check your details.");
        else if (data.session) onClose(); else setMessage("Account created. Check your email to confirm your account, then sign in.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) setMessage("We could not se        if (error) setMessagry again."); else setMessage("Reset email sent. Check your inbox for the next step.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) setMessage("We could not update your password. Please request a new reset email."); else { setMessage("Password updated. You can continue learning."); setMode("signin"); }
      }
    } catch { setMessage("The request could not be completed. Check your connection and try again."); } finally { setBusy(false); }
  };
  const title = mode === "signup" ? "Create your learning profile." : mode === "forgot" ? "Recover your account." : mode === "reset" ? "Choose a new password." : "Welcome back to your studio.";
  const eyebrow = mode === "signup" ? "START YOUR PROFILE" : mode === "forgot" ? "ACCOUNT RECOVERY" : "SAVE YOUR STARTING POINT";
  return <div className="assessment-overlay"><form className="assessment-modal" onSubmit={submit}><button type="button" className="assessment-close" onClick={onClose} aria-label="Close">×</button><span className="v1-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{mode === "signup" ? "Create an account so ByteCraft can remember your evidence and path." : mode === "forgot" ? "Enter your email and we will send a secure reset link." : "Your learning state is tied to your account, not this browser."}</p>{mode !== "reset" && <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />}{mode !== "forgot" && <input type="password" required minLength={6} placeholder={mode === "reset" ? "New password" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} />}{mode === "signup" && <input type="password" required minLength={6} placeholder="Confirm password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />}{message && <small className="auth-message" role="status">{message}</small>}<button className="v1-primary" disabled={busy}>{busy ? "Working…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset email" : mode === "reset" ? "Update password" : "Sign in"}</button><div className="auth-links">{mode === "signin" && <><button type="button" onClick={() => setMode("signup")}>Create account</button><button type="button" onClick={() => setMode("forgot")}>Forgot password?</button></>}{mode === "signup" && <button type="button" onClick={() => setMode("signin")}>Already have an account? Sign in</button>}{mode === "forgot" && <button type="button" onClick={() => setMode("signin")}>Back to sign in</button>}{mode === "reset" && <button type="button" onClick={() => setMode("signin")}>Back to sign in</button>}</div></form></div>;
}
export function AssessmentFlow({ user, learnerState, learnerStateLoading, learnerStateError, onLearnerStateChange, onComplete }: { user: unknown; learnerState: LearnerState | null; learnerStateLoading: boolean; learnerStateError: string | null; onLearnerStateChange: () => Promise<void>; onComplete: (profile: Profile) => void }) {
  const initial = readState();
  const authenticated = Boolean(user) && isSupabaseConfigured;
  const [stage, setStage] = useState<"landing" | "onboarding" | "assessment" | "profile">(authenticated ? (routeForLearnerState(learnerState)) : initial?.stage ?? "landing");
  const emptyOnboarding: Onboarding = { goal: "", customGoal: "", timeline: "", availability: "", language: "", selfAssessment: "" };
  const [onboarding, setOnboarding] = useState<Onboarding>(authenticated ? (learnerState?.onboarding as Onboarding ?? emptyOnboarding) : (initial?.onboarding ?? emptyOnboarding));
  const [onboardingStep, setOnboardingStep] = useState(authenticated ? 0 : initial?.onboardingStep ?? 0);
  const [item, setItem] = useState(authenticated ? currentAssessmentIndex(learnerState) : initial?.item ?? 0); const [sessionId, setSessionId] = useState<string | null>(authenticated ? learnerState?.assessment?.id ?? null : initial?.sessionId ?? null); const [responses, setResponses] = useState<Response[]>(authenticated ? [] : initial?.responses ?? []); const [profile, setProfile] = useState<Profile | null>(authenticated ? profileFromLearnerState(learnerState) : initial?.profile ?? null); const [showSignIn, setShowSignIn] = useState(false); const [startedAt, setStartedAt] = useState(Date.now()); const [hintCount, setHintCount] = useState(0); const [message, setMessage] = useState("");
  useEffect(() => {
    if (!authenticated || learnerStateLoading || !learnerState) return;
    setStage(learnerState.next === "assessment" ? "assessment" : learnerState.next === "path" ? "profile" : "onboarding");
    setOnboarding((learnerState.onboarding as Onboarding) ?? emptyOnboarding);
    setItem(Math.max(0, (learnerState.assessment?.currentSequence ?? 1) - 1));
    setSessionId(learnerState.assessment?.id ?? null);
    setProfile(profileFromLearnerState(learnerState));
  }, [authenticated, learnerState, learnerStateLoading]);
  const save = (patch: Record<string, unknown>) => { if (!authenticated) localStorage.setItem(key, JSON.stringify({ stage, onboarding, onboardingStep, item, responses, profile, ...patch })); };
  const begin = async () => { if (isSupabaseConfigured && !user) { setShowSignIn(true); return; } setStage("assessment"); setItem(0); setResponses([]); setStartedAt(Date.now()); const started = await post("/api/assessments", { onboarding }); const id = started?.id ?? null; setSessionId(id); if (authenticated) await onLearnerStateChange(); else save({ stage: "assessment", item: 0, responses: [], sessionId: id }); };
  const finish = async (nextResponses: Response[]) => { const complexityMiss = nextResponses.filter((r) => r.problemSlug === "two-sum" && /n\^?2|nested|brute|two loops/i.test(`${r.approach} ${r.complexity}`)).length; const transfer = nextResponses.filter((r) => r.problemSlug === "valid-anagram" && /map|hash|count|frequency|set/i.test(`${r.approach} ${r.dataStructure}`)).length; const strength = nextResponses.filter((r) => r.result === "solved" && r.code.trim()).length; const developing = complexityMiss ? ["Complexity analysis", "Optimization"] : transfer ? ["Pattern recognition"] : ["Problem decomposition"]; const evidence = complexityMiss ? ["On Two Sum, you described repeated searching without consistently connecting the constraints to feasibility."] : ["Your diagnostic responses provide an initial signal; more problems are needed before making stronger claims."]; const rec = complexityMiss ? { title: "Constraint-first problem solving", targetSkill: "complexity_analysis", reason: `Your assessment showed repeated-search thinking before a clear feasibility check. Start by practicing constraints before choosing a data structure.`, minutes: 30 } : { title: "Hash-map pattern recognition", targetSkill: "pattern_recognition", reason: "You can work through array logic, but the transfer problem is still an open signal. Two short lookup problems are the next useful probe.", minutes: 30 }; const result: Profile = { strengths: strength ? ["Implementation"] : [], developing, unknown: ["Debugging", "Trees and graphs", "Transfer beyond this assessment"], evidence, recommendation: rec, path: ["Constraint-first problem solving", "Hash-map pattern recognition", "Two Sum"] }; setProfile(result); setStage("profile"); save({ stage: "profile", profile: result, responses: nextResponses }); if (sessionId) await post(`/api/assessments/${sessionId}/complete`, {}); onComplete(result); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const response: Response = { problemSlug: problems[item].slug, sequence: item + 1, result: form.get("result") as Response["result"], hintCount, approach: String(form.get("approach") ?? ""), complexity: String(form.get("complexity") ?? ""), dataStructure: String(form.get("dataStructure") ?? ""), code: String(form.get("code") ?? ""), explanation: String(form.get("explanation") ?? ""), durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) };
    if (authenticated && !sessionId) { setMessage("No active server assessment was found. Please restart the assessment."); return; }
    const next = [...responses, response];
    if (sessionId) await post(`/api/assessments/${sessionId}/items/${problems[item].slug}/respond`, response);
    if (authenticated) {
      if (item === problems.length - 1) await post(`/api/assessments/${sessionId}/complete`, {});
      await onLearnerStateChange();
      return;
    }
    setResponses(next); save({ responses: next, item: item + 1 });
    if (item === problems.length - 1) await finish(next);
    else { setItem(item + 1); setHintCount(0); setStartedAt(Date.now()); }
  };
  if (authenticated && learnerStateLoading) return <div className="assessment-page"><section className="assessment-card"><p>Loading your saved learning state…</p></section></div>;
  if (authenticated && learnerStateError) return <div className="assessment-page"><section className="assessment-card"><h2>We could not load your saved learning state.</h2><p>{learnerStateError}</p><button className="v1-primary" onClick={() => void onLearnerStateChange()}>Retry</button></section></div>;
  if (stage === "onboarding") return <Onboarding data={onboarding} step={onboardingStep} setData={setOnboarding} setStep={setOnboardingStep} onStart={begin} save={save} persist={async (value) => { if (authenticated) await put("/api/me/onboarding", value); }} showSignIn={showSignIn} onCloseSignIn={() => setShowSignIn(false)} />;
  if (stage === "assessment") return <Diagnostic problem={problems[item]} index={item} hintCount={hintCount} setHintCount={setHintCount} onSubmit={submit} message={message} setMessage={setMessage} />;
  return profile ? <Profile profile={profile} onContinue={() => onComplete(profile)} /> : null;
}

function Onboarding({ data, step, setData, setStep, onStart, save, persist, showSignIn, onCloseSignIn }: { data: Onboarding; step: number; setData: React.Dispatch<React.SetStateAction<Onboarding>>; setStep: React.Dispatch<React.SetStateAction<number>>; onStart: () => void; save: (patch: Record<string, unknown>) => void; persist: (value: Onboarding) => Promise<void>; showSignIn: boolean; onCloseSignIn: () => void }) {
  const fields = [
    <Choice title="What are you working toward?" options={goals} value={data.goal} customValue={data.customGoal ?? ""} onCustomValue={(value) => setData((current) => ({ ...current, customGoal: value }))} onChange={(value) => setData((current) => ({ ...current, goal: value, ...(value === "Custom goal" ? {} : { customGoal: "" }) }))} />,
    <Choice title="When do you want to reach it?" options={["1 month", "3 months", "6 months", "1 year", "No fixed deadline"]} value={data.timeline} onChange={(value) => setData((current) => ({ ...current, timeline: value }))} />,
    <Choice title="How much time can you realistically spend per day?" options={["15–30 minutes/day", "30–60 minutes/day", "1–2 hours/day", "2+ hours/day"]} value={data.availability} onChange={(value) => setData((current) => ({ ...current, availability: value }))} />,
    <Choice title="Which language do you want to practice?" options={languages} value={data.language} onChange={(value) => setData((current) => ({ ...current, language: value }))} />,
    <Choice title="How comfortable are you solving problems without seeing a solution first?" options={["I am just starting", "I can solve familiar problems", "I can usually find a path", "I want harder unfamiliar problems"]} value={data.selfAssessment} onChange={(value) => setData((current) => ({ ...current, selfAssessment: value }))} />,
  ];
  const selected = step === 0 ? (data.goal === "Custom goal" ? data.customGoal?.trim() : data.goal) : [data.timeline, data.availability, data.language, data.selfAssessment][step - 1]; const next = () => { if (!selected) return; if (step === 4) { void persist(data).then(onStart); } else { const nextStep = step + 1; setStep(nextStep); save({ onboarding: data, onboardingStep: nextStep }); } };
  return <div className="assessment-page"><div className="assessment-progress"><span>STEP {step + 1} OF 5</span><div><i style={{ width: `${((step + 1) / 5) * 100}%` }} /></div></div><MotionSection className="assessment-card"><span className="v1-eyebrow">LET'S FIND YOUR STARTING POINT</span>{fields[step]}<div className="assessment-actions">{step > 0 && <button className="assessment-secondary" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>}<button className="v1-primary" disabled={!selected} onClick={next}>{step === 4 ? "Start diagnostic" : "Continue"} <ArrowRight size={15} /></button></div></MotionSection><p className="assessment-note">You can change this later. Self-assessment is only one signal; the diagnostic does the real measuring.</p>{showSignIn && <AuthDialog onClose={onCloseSignIn} />}</div>;
}
function Choice({ title, options, value, customValue = "", onChange, onCustomValue }: { title: string; options: string[]; value: string; customValue?: string; onChange: (value: string) => void; onCustomValue?: (value: string) => void }) { return <div className="assessment-choice"><h1>{title}</h1><div>{options.map((option) => <button className={value === option ? "selected" : ""} key={option} onClick={() => onChange(option)}>{option}{value === option && <Check size={16} />}</button>)}</div>{value === "Custom goal" && <input value={customValue} placeholder="Tell us what you are working toward" onChange={(e) => onCustomValue?.(e.target.value)} />}</div>; }

function Diagnostic({ problem, index, hintCount, setHintCount, onSubmit, message, setMessage }: { problem: typeof problems[number]; index: number; hintCount: number; setHintCount: React.Dispatch<React.SetStateAction<number>>; onSubmit: (event: React.FormEvent) => void; message: string; setMessage: (value: string) => void }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const chooseHelp = (text: string, count = false) => {
    setMessage(text);
    setHelpOpen(false);
    if (count) setHintCount(hintCount + 1);
  };
  return (
    <div className="assessment-page">
      <div className="assessment-progress" aria-label={`Assessment problem ${index + 1} of 3`}>
        <span>PROBLEM {String(index + 1).padStart(2, "0")} <i>/ 03</i> · {problem.time}</span>
        <div><i style={{ width: `${((index + 1) / 3) * 100}%` }} /></div>
      </div>
      <MotionSection className="assessment-card diagnostic-card">
        <div className="diagnostic-header">
          <span className="v1-eyebrow">DIAGNOSTIC · OBSERVE YOUR APPROACH</span>
          <span className="assessment-timer"><Clock3 size={14} /> No rush</span>
        </div>
        <div className="diagnostic-topic"><span>ARRAYS & LOOKUP PATTERNS</span><span>PROBLEM {index + 1} / 3</span></div>
        <h1>{problem.title}</h1>
        <p className="diagnostic-prompt">{problem.prompt}</p>
        <form onSubmit={onSubmit}>
          <label>YOUR APPROACH<textarea name="approach" required placeholder="Explain what you would do before writing code…" /></label>
          <label>EXPECTED COMPLEXITY<span className="label-hint">What happens as the input gets bigger?</span><input name="complexity" required placeholder="For example: O(n) time, O(n) space" /></label>
          <label>DATA STRUCTURE<span className="label-hint">Optional — choose what feels natural.</span><input name="dataStructure" placeholder="For example: hash map, set, two pointers" /></label>
          <label>OPTIONAL CODE OR PSEUDOCODE<textarea name="code" placeholder="You can write pseudocode if that is clearer…" /></label>
          <fieldset><legend>HOW DID THIS ATTEMPT GO?</legend><div className="result-buttons">{(["solved", "partial", "stuck"] as const).map((result) => <label key={result}><input type="radio" name="result" value={result} defaultChecked={result === "partial"} /> <span>{result}</span></label>)}</div></fieldset>
          {message && <div className="assessment-warning"><Sparkles size={15} /><span>{message}</span></div>}
          <div className="diagnostic-actions">
            <button type="button" className="assessment-help-trigger" onClick={() => setHelpOpen(!helpOpen)}><Sparkles size={15} /> Need help?</button>
            <button type="submit" className="v1-primary">{index === 2 ? "Finish assessment" : "Continue"} <ArrowRight size={15} /></button>
          </div>
          {helpOpen && <div className="byte-help-panel">
            <div><span className="v1-eyebrow">BYTE · CONTEXTUAL HELP</span><button type="button" className="assessment-close-small" onClick={() => setHelpOpen(false)}>Close</button></div>
            <p>Choose the kind of help that matches where you are right now.</p>
            <button type="button" onClick={() => chooseHelp("Read the prompt once for inputs, outputs, and constraints. Say the task back in your own words.")}><b>I don’t understand the problem</b><small>Clarify the shape of the task</small></button>
            <button type="button" onClick={() => chooseHelp("Ask what the largest possible input is. Then check whether your approach repeats work as that input grows.")}><b>I’m unsure about the constraints</b><small>Find the bottleneck before coding</small></button>
            <button type="button" onClick={() => chooseHelp(problem.hint, true)}><b>Give me a hint</b><small>One nudge, no solution</small></button>
          </div>}
        </form>
      </MotionSection>
      <p className="assessment-note">This is a diagnostic, not a test you can fail. Hints are part of the evidence, not a penalty.</p>
    </div>
  );
}

function Profile({ profile, onContinue }: { profile: Profile; onContinue: () => void }) {
  return <div className="assessment-page"><MotionSection className="profile-hero"><span className="v1-eyebrow">YOUR STARTING POINT</span><h1>You already have a place to begin.</h1><p>Three problems cannot measure everything. They can give us a useful first direction — and a reason for the next step.</p><div className="profile-hero-meta"><span><Check size={14} /> Assessment complete</span><span><LockKeyhole size={14} /> Evidence stays yours</span></div></MotionSection><MotionSection className="assessment-card"><span className="v1-eyebrow">EVIDENCE-BACKED PROFILE</span><h2 className="profile-summary">Your biggest opportunity right now is learning to recognize when a problem can be optimized.</h2><div className="profile-columns"><ProfileColumn title="Strong" items={profile.strengths} empty="No strong signal yet — that is okay." tone="strong" /><ProfileColumn title="Not assessed" items={profile.unknown} tone="unknown" /></div><details className="evidence-disclosure"><summary><span>Why does ByteCraft think this?</span><ChevronDown size={16} /></summary><div className="evidence-box">{profile.evidence.map((item) => <p key={item}><span className="evidence-label observed">OBSERVED</span>“{item}”</p>)}<p className="evidence-confidence">Confidence: Moderate · This profile will change as you practice.</p></div></details></MotionSection><MotionSection className="recommendation-card"><div><span className="v1-eyebrow">YOUR NEXT MOVE</span><h2>{profile.recommendation.title}</h2><p>{profile.recommendation.reason}</p><span className="recommendation-time">About {profile.recommendation.minutes} minutes</span></div><button className="v1-primary" onClick={onContinue}>See my path <ArrowRight size={15} /></button><details className="recommendation-why"><summary>Why this? <ChevronDown size={15} /></summary><p>Your goal and available time shape this recommendation. It strengthens <b>{profile.recommendation.targetSkill.replace(/_/g, " ")}</b> without introducing a new prerequisite.</p></details></MotionSection><MotionSection className="assessment-card"><span className="v1-eyebrow">SMALL STARTING PATH</span><div className="path-list">{profile.path.map((item, index) => <div key={item} className={index === 0 ? "current" : ""}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item}</strong><small>{index === 0 ? "Build the habit first" : index === 1 ? "Then reinforce the pattern" : "After the next signal"}</small></div>{index === 0 && <em>Start here</em>}</div>)}</div></MotionSection></div>;
}

function ProfileColumn({ title, items, empty, tone }: { title: string; items: string[]; empty?: string; tone: "strong" | "developing" | "unknown" }) { return <div className={`profile-column profile-${tone}`}><h3>{title}</h3>{items.length ? items.map((item) => <p key={item}><span className="profile-dot" /> {item}</p>) : <small>{empty}</small>}</div>; }

function MotionSection({ children, className }: { children: React.ReactNode; className?: string }) { const reduce = useReducedMotion(); return <motion.section className={className} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }}>{children}</motion.section>; }
