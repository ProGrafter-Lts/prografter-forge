import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

const TradePasswordSection = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSetPassword = async () => {
    setError("");
    setDone(false);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }
    setSaving(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updErr) {
      const friendly = /pwned|weak|easy to guess/i.test(updErr.message)
        ? "That password is too common and has appeared in data breaches. Please choose a stronger one (try a mix of unrelated words, numbers and symbols)."
        : updErr.message;
      setError(friendly);
      toast.error("Couldn't set password");
    } else {
      setDone(true);
      setPassword("");
      setConfirmPassword("");
      toast.success("Password set — you can now sign in with email and password");
    }
  };

  return (
    <div className="bg-card rounded-2xl p-6 border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))] space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground rounded-xl p-2.5">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading text-primary text-lg">Set a password — skip the email next time</h3>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            Optional. Add a password so you can sign in without waiting for a link. Magic links still work too.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            New password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Confirm password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 font-mono text-xs">
          {error}
        </div>
      )}
      {done && (
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 font-mono text-xs">
          Password set. You can now sign in with your email and password.
        </div>
      )}

      <p className="font-mono text-[11px] text-muted-foreground">
        Use at least 8 characters. Avoid common passwords — a mix of unrelated words, numbers and symbols works best.
      </p>

      <div className="flex justify-end">
        <button
          onClick={handleSetPassword}
          disabled={saving || !password}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          {saving ? "Saving…" : "Set password"}
        </button>
      </div>
    </div>
  );
};

export default TradePasswordSection;
