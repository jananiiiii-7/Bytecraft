import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  onSuccess?: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgot: () => void;
  setError: (msg: string | null) => void;
};

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgot,
  setError,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="login-email"
          className="text-muted-foreground font-normal text-xs"
        >
          Email
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="os-input font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="login-password"
          className="text-muted-foreground font-normal text-xs"
        >
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="os-input font-mono text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onSwitchToForgot}
        className="text-xs text-primary hover:underline"
      >
        Forgot password?
      </button>
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={loading} className="w-full os-button">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full os-button"
        >
          Continue with Google
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-primary hover:underline"
        >
          Register
        </button>
      </p>
    </form>
  );
}
