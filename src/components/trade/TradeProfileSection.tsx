import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCircle, BadgeCheck, Save } from "lucide-react";

interface TradeProfileSectionProps {
  tradeId: string;
}

const TradeProfileSection = ({ tradeId }: TradeProfileSectionProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    company_name: "",
    phone: "",
    postcode: "",
    trade_type: "",
    bio: "",
    website: "",
    years_experience: 0,
  });
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      const { data, error } = await supabase
        .from("trades")
        .select("name, company_name, phone, postcode, trade_type, bio, website, years_experience, verified")
        .eq("id", tradeId)
        .single();

      if (error) {
        toast.error("Failed to load profile");
      } else if (data) {
        setForm({
          name: data.name || "",
          company_name: data.company_name || "",
          phone: data.phone || "",
          postcode: data.postcode || "",
          trade_type: data.trade_type || "",
          bio: data.bio || "",
          website: data.website || "",
          years_experience: data.years_experience || 0,
        });
        setVerified(data.verified);
      }
      setLoading(false);
    };
    load();
  }, [tradeId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("trades")
      .update(form)
      .eq("id", tradeId);
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
        <div className="bg-primary text-primary-foreground rounded-xl p-3">
          <UserCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-heading text-primary text-2xl">My Profile</h2>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            Manage your trade account details
          </p>
        </div>
        {verified && (
          <span className="ml-auto flex items-center gap-1 bg-secondary/10 text-secondary px-3 py-1 rounded-full font-mono text-xs">
            <BadgeCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
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
            label="Company name"
            value={form.company_name}
            onChange={(v) => setForm({ ...form, company_name: v })}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <Field
            label="Postcode"
            value={form.postcode}
            onChange={(v) => setForm({ ...form, postcode: v.toUpperCase() })}
          />
          <Field
            label="Trade type"
            value={form.trade_type}
            onChange={(v) => setForm({ ...form, trade_type: v })}
          />
          <Field
            label="Website"
            value={form.website}
            onChange={(v) => setForm({ ...form, website: v })}
          />
          <Field
            label="Years experience"
            type="number"
            value={String(form.years_experience)}
            onChange={(v) => setForm({ ...form, years_experience: Number(v) || 0 })}
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Tell homeowners about your work…"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  type?: string;
}) => (
  <div>
    <label className="block font-mono text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full bg-background border border-border rounded-xl px-4 py-2.5 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        readOnly ? "opacity-60 cursor-not-allowed" : ""
      }`}
    />
  </div>
);

export default TradeProfileSection;
