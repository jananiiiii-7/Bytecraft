import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterFormProps = {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
  setError: (msg: string | null) => void;
};

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
  setError,
}: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
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
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="reg-email"
          className="text-muted-foreground font-normal text-xs"
        >
          Email
        </Label>
        <Input
          id="reg-email"
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
          htmlFor="reg-password"
          className="text-muted-foreground font-normal text-xs"
        >
          Password
        </Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          className="os-input font-mono text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={loading} className="w-full os-button">
          {loading ? "Creating account…" : "Create account"}
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
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
