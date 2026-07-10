import { User, Building2, Mail, Phone } from "lucide-react";
import { HubCard, HubButton, HubField, HubInput, HubBadge } from "@/hub/components/ui";

const HubProfile = () => (
  <>
    <div>
      <h1 className="hub-page-title">Profile</h1>
      <p className="hub-page-sub">How customers and the platform see your business.</p>
    </div>

    <div className="hub-grid-2" style={{ marginTop: 28, alignItems: "start" }}>
      <HubCard>
        <div className="flex items-center gap-4">
          <span className="hub-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
            LB
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Lee Bennett</div>
            <div style={{ color: "#8a97a8", fontSize: 14 }}>Bennett Building Ltd</div>
            <div style={{ marginTop: 8 }}>
              <HubBadge tone="success" dot>
                Verified trade
              </HubBadge>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22, display: "grid", gap: 12 }}>
          <div className="flex items-center gap-3" style={{ color: "#45536b", fontSize: 14 }}>
            <Building2 size={16} /> Building & Extensions
          </div>
          <div className="flex items-center gap-3" style={{ color: "#45536b", fontSize: 14 }}>
            <Mail size={16} /> lee@bennettbuilding.co.uk
          </div>
          <div className="flex items-center gap-3" style={{ color: "#45536b", fontSize: 14 }}>
            <Phone size={16} /> Not added yet
          </div>
        </div>
      </HubCard>

      <HubCard>
        <h2 className="hub-section-title" style={{ marginBottom: 18 }}>
          Business details
        </h2>
        <div style={{ display: "grid", gap: 16 }}>
          <HubField label="Company name">
            <HubInput placeholder="Bennett Building Ltd" />
          </HubField>
          <HubField label="Contact name">
            <HubInput placeholder="Lee Bennett" />
          </HubField>
          <HubField label="Service area">
            <HubInput placeholder="Guildford & Surrey" />
          </HubField>
          <HubButton icon={<User size={16} />}>Save changes</HubButton>
        </div>
      </HubCard>
    </div>
  </>
);

export default HubProfile;
