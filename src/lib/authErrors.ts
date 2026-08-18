export type AuthErrorLike = {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
};

function asAuthError(error: unknown): AuthErrorLike {
  return error && typeof error === "object" ? (error as AuthErrorLike) : {};
}

export function classifySignupError(error: unknown, configured: boolean): string {
  if (!configured) return "Authentication is not configured for this environment.";

  const details = asAuthError(error);
  const message = details.message ?? "";
  const lower = message.toLowerCase();
  console.warn("Supabase signup failed", {
    message: details.message,
    code: details.code,
    status: details.status,
    name: details.name,
  });

  if (/failed to fetch|network|fetch|timeout|offline|connection/i.test(lower)) {
    return "We could not reach the account service. Check your connection and try again.";
  }
  if (details.status === 429 || /rate limit|too many requests/i.test(lower)) {
    return "Too many signup attempts. Please wait a moment and try again.";
  }
  if (/already|registered|user exists|duplicate/i.test(lower)) {
    return "An account may already exist for this email. Try signing in or resetting your password.";
  }
  if (/password|weak|at least|characters/i.test(lower)) {
    return "Choose a stronger password and try again.";
  }
  if (/email|invalid/i.test(lower)) {
    return "Please check your email address and try again.";
  }
  if (details.status && details.status >= 500) {
    return "The account service is temporarily unavailable. Please try again later.";
  }
  return "We could not complete signup. Please check your details and try again.";
}

export function describeSignupSuccess(data: { user?: unknown; session?: unknown } | null | undefined): string {
  if (!data?.user) return "We could not complete signup. Please try again.";
  if (data.session) return "";
  return "Account created. Check your email to confirm your account, then sign in.";
}
