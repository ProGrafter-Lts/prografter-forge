import { useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";

interface ProjectMessage {
  id: string;
  job_id: string;
  sender_id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
}

interface MessagingPanelProps {
  messages: ProjectMessage[];
  userId: string | null;
  msgText: string;
  onMsgTextChange: (text: string) => void;
  onSendMessage: () => void;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const MessagingPanel = ({ messages, userId, msgText, onMsgTextChange, onSendMessage }: MessagingPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section>
      <h2 className="font-heading text-navy text-2xl mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" /> Messages
      </h2>
      <div className="bg-card rounded-2xl border border-navy/10 shadow-sm flex flex-col" style={{ height: "400px" }}>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="font-mono text-sm text-secondary-text text-center mt-16">No messages yet. Start the conversation.</p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? "bg-teal text-white" : "bg-cream"}`}>
                  <p className={`font-mono text-xs ${isMine ? "text-white/70" : "text-secondary-text"} mb-0.5`}>
                    {m.sender_type === "trade" ? "Trade" : "Homeowner"}
                  </p>
                  <p className={`font-body text-sm ${isMine ? "text-white" : "text-body-text"}`}>{m.message_text}</p>
                  <p className={`font-mono text-[10px] mt-1 ${isMine ? "text-white/50" : "text-secondary-text"}`}>{timeAgo(m.created_at)}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="border-t border-navy/10 p-3 flex gap-2">
          <input
            value={msgText}
            onChange={(e) => onMsgTextChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSendMessage()}
            placeholder="Type a message…"
            className="flex-1 border border-navy/10 rounded-xl px-4 py-2 font-mono text-sm text-body-text placeholder:text-secondary-text/50 focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <button onClick={onSendMessage} className="bg-teal text-white p-2.5 rounded-xl hover:bg-teal-hover transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default MessagingPanel;
