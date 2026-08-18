import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ForgotPasswordFormProps = {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
  setError: (msg: string | null) => void;
};

export function ForgotPasswordForm({
  onSuccess,
  onSwitchToLogin,
  setError,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">
          Check your email for a link to reset your password.
        </p>
        <Button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full os-button"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label
          htmlFor="forgot-email"
          className="text-muted-foreground font-normal text-xs"
        >
          Email
        </Label>
        <Input
          id="forgot-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="os-input font-mono text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={loading} className="w-full os-button">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onSwitchToLogin}
          disabled={loading}
          className="w-full"
        >
          Back to sign in
        </Button>
      </div>
    </form>
  );
}
