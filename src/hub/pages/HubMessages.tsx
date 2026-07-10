import { MessageSquare } from "lucide-react";
import HubPlaceholder from "@/hub/pages/HubPlaceholder";

const HubMessages = () => (
  <HubPlaceholder
    title="Messages"
    subtitle="Talk to customers and keep every conversation in context."
    icon={<MessageSquare size={22} />}
    emptyTitle="No conversations yet"
    emptyDescription="When a customer gets in touch, your threads will show up here."
  />
);

export default HubMessages;
