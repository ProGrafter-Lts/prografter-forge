import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCircle, Save, KeyRound } from "lucide-react";


const HomeownerProfileSection = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [homeownerId, setHomeownerId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });

  // Optional password — the durable way back in.
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSet, setPasswordSet] = useState(false);

  const handleSetPassword = async () => {
    setPasswordError("");
    setPasswordSet(false);
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("The two passwords don't match.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      const friendly = /pwned|weak|easy to guess/i.test(error.message)
        ? "That password is too common and has appeared in data breaches. Please choose a stronger one (try a mix of unrelated words, numbers and symbols)."
        : error.message;
      setPasswordError(friendly);
      toast.error("Couldn't set password");
    } else {
      setPasswordSet(true);
      setPassword("");
      setConfirmPassword("");
      toast.success("Password set — you can now sign in with email and password");
    }
  };




  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (user.email) setEmail(user.email);

      const { data, error } = await supabase
        .from("homeowners")
        .select("id, name, phone")
        .eq("user_id", user.id)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else if (data) {
        setHomeownerId(data.id);
        setForm({ name: data.name || "", phone: data.phone || "" });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!homeownerId) return;
    setSaving(true);
    const { error } = await supabase
      .from("homeowners")
      .update({ name: form.name, phone: form.phone })
      .eq("id", homeownerId);
    setSaving(false);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated");
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-8 border border-border">
        <p className="font-mono text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-secondary text-secondary-foreground rounded-xl p-3">
          <UserCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-heading text-primary text-2xl">My Profile</h2>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            Manage your account details
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Email" value={email} readOnly />
          <Field
            label="Full name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground font-mono text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <div id="set-password" className="bg-card rounded-2xl p-6 border border-border space-y-5">
        <div className="flex items-center gap-3">
          <div className="bg-secondary text-secondary-foreground rounded-xl p-2.5">
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
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
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
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
        </div>

        {passwordError && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 font-mono text-xs">
            {passwordError}
          </div>
        )}
        {passwordSet && (
          <div className="bg-secondary/10 border border-secondary/30 text-secondary rounded-xl px-4 py-3 font-mono text-xs">
            Password set. You can now sign in with your email and password.
          </div>
        )}

        <p className="font-mono text-[11px] text-muted-foreground">
          Use at least 8 characters. Avoid common passwords — a mix of unrelated words, numbers and symbols works best.
        </p>

        <div className="flex justify-end">
          <button
            onClick={handleSetPassword}
            disabled={savingPassword || !password}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground font-mono text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {savingPassword ? "Saving…" : "Set password"}
          </button>
        </div>
      </div>
    </section>
  );
};

const Field = ({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) => (
  <div>
    <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <input
      type="text"
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/30 ${
        readOnly ? "opacity-60 cursor-not-allowed" : ""
      }`}
    />
  </div>
);

export default HomeownerProfileSection;
