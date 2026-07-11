import { useMemo, useState } from "react";
import { Check, User } from "lucide-react";
import { HubCard, HubButton, HubField, HubInput, HubBadge } from "@/hub/components/ui";
import { getBusinessProfile, saveBusinessProfile, type BusinessProfile } from "@/hub/data/business";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const HubProfile = () => {
  const [profile, setProfile] = useState<BusinessProfile>(() => getBusinessProfile());
  const [saved, setSaved] = useState(false);

  const set = (key: keyof BusinessProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((p) => ({ ...p, [key]: e.target.value }));
    setSaved(false);
  };

  const onSave = () => {
    saveBusinessProfile(profile);
    setSaved(true);
  };

  const avatar = useMemo(() => initials(profile.contactName || "PG"), [profile.contactName]);

  return (
    <>
      <div>
        <h1 className="hub-page-title">Profile</h1>
        <p className="hub-page-sub">This is how customers and the platform see your business.</p>
      </div>

      <div style={{ maxWidth: 620, marginTop: 28 }}>
        <HubCard>
          <div className="flex items-center gap-4">
            <span className="hub-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
              {avatar}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{profile.contactName || "Your name"}</div>
              <div style={{ color: "#8a97a8", fontSize: 14 }}>
                {profile.businessName || "Your business"}
              </div>
              <div style={{ marginTop: 8 }}>
                <HubBadge tone="success" dot>
                  Verified trade
                </HubBadge>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
            <HubField label="Contact name">
              <HubInput value={profile.contactName} onChange={set("contactName")} placeholder="Lee Bennett" />
            </HubField>
            <HubField label="Company name">
              <HubInput value={profile.businessName} onChange={set("businessName")} placeholder="Bennett Building Ltd" />
            </HubField>
            <HubField label="Trade">
              <HubInput value={profile.tradeType} onChange={set("tradeType")} placeholder="Building & Extensions" />
            </HubField>
            <HubField label="Service area">
              <HubInput value={profile.serviceArea} onChange={set("serviceArea")} placeholder="Guildford & Surrey" />
            </HubField>
            <HubField label="Email">
              <HubInput value={profile.email} onChange={set("email")} placeholder="lee@bennettbuilding.co.uk" />
            </HubField>
            <HubField label="Phone">
              <HubInput value={profile.phone} onChange={set("phone")} placeholder="07700 900123" />
            </HubField>

            <HubButton icon={saved ? <Check size={16} /> : <User size={16} />} onClick={onSave}>
              {saved ? "Saved" : "Save changes"}
            </HubButton>
          </div>
        </HubCard>
      </div>
    </>
  );
};

export default HubProfile;
