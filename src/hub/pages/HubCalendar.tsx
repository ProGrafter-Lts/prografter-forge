import { Calendar } from "lucide-react";
import HubPlaceholder from "@/hub/pages/HubPlaceholder";

const HubCalendar = () => (
  <HubPlaceholder
    title="Calendar"
    subtitle="Your jobs, site visits and follow-ups in one place."
    icon={<Calendar size={22} />}
    emptyTitle="Nothing scheduled yet"
    emptyDescription="Bookings and follow-ups will appear here once you start winning work."
  />
);

export default HubCalendar;
