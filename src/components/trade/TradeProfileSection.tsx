import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCircle, Save, Sparkles } from "lucide-react";
import { GreenSpecialistBanner, CertificationsSection } from "@/components/GreenCertBadges";
import VerifiedTradeBadge from "@/components/trade/VerifiedTradeBadge";
import SpecialismsPicker from "@/components/SpecialismsPicker";
import {
  Specialism,
  fetchSpecialisms,
  fetchTradeSpecialisms,
  saveTradeSpecialisms,
} from "@/lib/specialisms";

interface TradeProfileSectionProps {
  tradeId: string;
}

interface GreenData {
  is_green_trade: boolean;
  mcs_number: string | null;
  mcs_verified: boolean;
  trustmark_number: string | null;
  trustmark_verified: boolean;
  pas_2030_accredited: boolean;
  pas_2035_coordinator: boolean;
  ozev_approved: boolean;
  fgas_registered: boolean;
  ciga_registered: boolean;
  inca_certified: boolean;
  green_cert_expiry: string | null;
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
  const [cpsScheme, setCpsScheme] = useState<string | null>(null);
  const [cpsRegistrationNumber, setCpsRegistrationNumber] = useState<string | null>(null);
  const [gasSafeNumber, setGasSafeNumber] = useState<string | null>(null);
  const [green, setGreen] = useState<GreenData | null>(null);
  const [allSpecialisms, setAllSpecialisms] = useState<Specialism[]>([]);
  const [selectedSpecialisms, setSelectedSpecialisms] = useState<string[]>([]);
  const [primarySpecialism, setPrimarySpecialism] = useState<string | null>(null);
  const [specialismsDirty, setSpecialismsDirty] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      const { data, error } = await supabase
        .from("trades")
        .select(
          "name, company_name, phone, postcode, trade_type, bio, website, years_experience, verification_status, cps_scheme, cps_registration_number, gas_safe_number, is_green_trade, mcs_number, mcs_verified, trustmark_number, trustmark_verified, pas_2030_accredited, pas_2035_coordinator, ozev_approved, fgas_registered, ciga_registered, inca_certified, green_cert_expiry",
        )
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
        setCpsScheme((data as any).cps_scheme ?? null);
        setCpsRegistrationNumber((data as any).cps_registration_number ?? null);
        setGasSafeNumber((data as any).gas_safe_number ?? null);
        setGreen({
          is_green_trade: data.is_green_trade,
          mcs_number: data.mcs_number,
          mcs_verified: data.mcs_verified,
          trustmark_number: data.trustmark_number,
          trustmark_verified: data.trustmark_verified,
          pas_2030_accredited: data.pas_2030_accredited,
          pas_2035_coordinator: data.pas_2035_coordinator,
          ozev_approved: data.ozev_approved,
          fgas_registered: data.fgas_registered,
          ciga_registered: data.ciga_registered,
          inca_certified: data.inca_certified,
          green_cert_expiry: data.green_cert_expiry,
        });
      }

      // Load specialisms catalogue + this trade's selection in parallel
      try {
        const [allSpec, mySpec] = await Promise.all([
          fetchSpecialisms(),
          fetchTradeSpecialisms(tradeId),
        ]);
        setAllSpecialisms(allSpec);
        setSelectedSpecialisms(mySpec.map((r) => r.specialism_id));
        const primary = mySpec.find((r) => r.is_primary);
        setPrimarySpecialism(primary?.specialism_id ?? null);
      } catch (specErr) {
        console.error("Failed to load specialisms", specErr);
      }

      setLoading(false);
    };
    load();
  }, [tradeId]);

  const handleSaveSpecialisms = async () => {
    try {
      await saveTradeSpecialisms(tradeId, selectedSpecialisms, primarySpecialism);
      await supabase
        .from("trades")
        .update({ specialisms_prompt_seen: true } as any)
        .eq("id", tradeId);
      setSpecialismsDirty(false);
      toast.success("Specialisms updated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save specialisms");
    }
  };

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
          <div className="ml-auto">
            <VerifiedTradeBadge
              tradeType={form.trade_type}
              cpsScheme={cpsScheme}
              cpsRegistrationNumber={cpsRegistrationNumber}
              gasSafeNumber={gasSafeNumber}
            />
          </div>
        )}
      </div>

      {green?.is_green_trade && <GreenSpecialistBanner show />}
      {green?.is_green_trade && <CertificationsSection trade={green} />}

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

      {/* Specialisms */}
      <div className="bg-card rounded-2xl p-6 border border-border space-y-5">
        <div className="flex items-center gap-3">
          <div className="bg-secondary text-secondary-foreground rounded-xl p-2.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-primary text-xl">Specialisms</h3>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              What kind of projects do you take on?
            </p>
          </div>
        </div>
        {allSpecialisms.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">No specialisms available.</p>
        ) : (
          <SpecialismsPicker
            tradeType={form.trade_type}
            selected={selectedSpecialisms}
            primaryId={primarySpecialism}
            onChange={(sel, pri) => {
              setSelectedSpecialisms(sel);
              setPrimarySpecialism(pri);
              setSpecialismsDirty(true);
            }}
            max={8}
            variant="light"
          />
        )}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveSpecialisms}
            disabled={!specialismsDirty}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-mono text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            Save specialisms
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
