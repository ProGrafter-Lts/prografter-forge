import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";

type Role = "user" | "assistant";
interface ChatMsg {
  role: Role;
  content: string;
}

interface Profile {
  user_type: string;
  full_name: string;
}

interface TradeContext {
  trade_type: string | null;
  activeProjectCount: number;
  pendingQuoteCount: number;
}

const PRE_LOGIN_TRADE_QUESTIONS = [
  "How much does ProGrafter cost?",
  "How do I register?",
  "How does the commission work?",
  "What trades can join?",
  "How do I get matched to jobs?",
  "Is there a lock-in?",
  "How do I get paid?",
];

const PRE_LOGIN_HOMEOWNER_QUESTIONS = [
  "How do I post a job?",
  "How much does it cost to post a job?",
  "Are the trades verified?",
  "How do quotes work?",
  "Can I track my project?",
  "What is the Homeowner Manual?",
  "Do I qualify for a green grant?",
];

const TRADE_QUESTIONS_NO_PROJECTS = [
  "How do I find jobs to quote on?",
  "How does my profile get verified?",
  "How do I submit a quote?",
  "How does payment work?",
  "How do I set my working radius?",
];

const TRADE_QUESTIONS_ACTIVE = [
  "How do I submit today's site update?",
  "How do I raise a variation?",
  "How do I request a stage payment?",
  "How do I message the homeowner?",
  "How do I mark a stage complete?",
  "How do I add a sub-contractor?",
];

const HOMEOWNER_QUESTIONS = [
  "How do I approve a variation?",
  "How do I release a stage payment?",
  "How do I message my trade?",
  "Where are my project photos?",
  "What is the Homeowner Manual?",
  "How do I confirm a stage is complete?",
];

const Chatbot = () => {
  const { isReady: sessionReady, session } = useAuthReady();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tradeContext, setTradeContext] = useState<TradeContext | null>(null);
  const [preLoginUserType, setPreLoginUserType] = useState<"trade" | "homeowner" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth + profile + trade context
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!sessionReady) return;

      if (!session?.user) {
        setIsAuthed(false);
        setProfile(null);
        setTradeContext(null);
        setAuthReady(true);
        return;
      }

      setIsAuthed(true);
      const { data: prof } = await supabase
        .from("profiles")
        .select("user_type, full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      setProfile((prof as Profile) ?? null);

      // If trade, load extra context for personalised chips + system prompt
      if (prof?.user_type === "trade") {
        const { data: trade } = await supabase
          .from("trades")
          .select("id, trade_type")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (trade?.id) {
          const [{ count: activeCount }, { count: quoteCount }] = await Promise.all([
            supabase
              .from("job_matches")
              .select("id", { count: "exact", head: true })
              .eq("trade_id", trade.id)
              .in("status", ["accepted", "in_progress"]),
            supabase
              .from("quotes")
              .select("id", { count: "exact", head: true })
              .eq("trade_id", trade.id)
              .eq("status", "pending"),
          ]);
          setTradeContext({
            trade_type: trade.trade_type ?? null,
            activeProjectCount: activeCount ?? 0,
            pendingQuoteCount: quoteCount ?? 0,
          });
        } else {
          setTradeContext({ trade_type: null, activeProjectCount: 0, pendingQuoteCount: 0 });
        }
      } else {
        setTradeContext(null);
      }
      setAuthReady(true);
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [sessionReady, session]);

  // Seed opening message when chat opens.
  useEffect(() => {
    if (!open || messages.length > 0) return;

    const seed = () => {
      if (isAuthed && profile) {
        const firstName = (profile.full_name || "").split(" ")[0] || "there";
        const opener =
          profile.user_type === "homeowner"
            ? `Hi ${firstName} 👋 I'm your ProGrafter guide. What do you need help with today?`
            : `Hi ${firstName} 👋 I'm your ProGrafter guide. What do you need help with today?`;
        setMessages([{ role: "assistant", content: opener }]);
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi 👋 I'm the ProGrafter assistant.\n\nAre you a trade or a homeowner? I can answer questions about how ProGrafter works, what it costs, and how to get started.",
          },
        ]);
      }
    };

    if (authReady) {
      seed();
      return;
    }
    const t = setTimeout(seed, 800);
    return () => clearTimeout(t);
  }, [open, authReady, isAuthed, profile, messages.length]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const firstName = (profile?.full_name || "").split(" ")[0] || null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const newMessages: ChatMsg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chatbot", {
        body: {
          messages: newMessages.slice(-6),
          isAuthenticated: isAuthed,
          userType: isAuthed ? profile?.user_type : preLoginUserType,
          firstName,
          tradeContext: tradeContext
            ? {
                trade_type: tradeContext.trade_type,
                active_projects: tradeContext.activeProjectCount,
                pending_quotes: tradeContext.pendingQuoteCount,
              }
            : null,
        },
      });

      if (error) {
        const ctx = (error as { context?: Response }).context;
        let msg = "Sorry — I had trouble responding. Please try again or email hello@prografter.co.uk.";
        if (ctx) {
          try {
            const j = await ctx.json();
            if (j?.message) msg = j.message;
          } catch { /* ignore */ }
        }
        setMessages([...newMessages, { role: "assistant", content: msg }]);
      } else if (data?.reply) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else if (data?.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      }
    } catch (e) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry — connection error. Please try again or email hello@prografter.co.uk.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Treat "authed but no profile row" as a guest for chip purposes.
  const isGuest = !isAuthed || !profile;
  // Determine which suggested chips to show
  const showTypePicker = isGuest && messages.length === 1 && !preLoginUserType;
  let suggested: string[] = [];
  if (isGuest && preLoginUserType === "trade" && messages.length <= 3) {
    suggested = PRE_LOGIN_TRADE_QUESTIONS;
  } else if (isGuest && preLoginUserType === "homeowner" && messages.length <= 3) {
    suggested = PRE_LOGIN_HOMEOWNER_QUESTIONS;
  } else if (!isGuest && profile?.user_type === "trade" && messages.length === 1) {
    suggested =
      (tradeContext?.activeProjectCount ?? 0) > 0
        ? TRADE_QUESTIONS_ACTIVE
        : TRADE_QUESTIONS_NO_PROJECTS;
  } else if (!isGuest && profile?.user_type === "homeowner" && messages.length === 1) {
    suggested = HOMEOWNER_QUESTIONS;
  }

  const handleTypePick = (type: "trade" | "homeowner") => {
    setPreLoginUserType(type);
    const note =
      type === "trade"
        ? "Great — I'll answer with trade-specific information. Ask me anything below or pick a question."
        : "Great — I'll answer with homeowner-specific information. Ask me anything below or pick a question.";
    setMessages((m) => [...m, { role: "user", content: type === "trade" ? "I'm a Tradesperson" : "I'm a Homeowner" }, { role: "assistant", content: note }]);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open ProGrafter chat assistant"
          className="fixed bottom-20 right-5 sm:bottom-5 z-[70] h-[55px] w-[55px] rounded-full bg-[#14A8A1] text-white shadow-lg hover:bg-[#0B7F74] transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#14A8A1] focus:ring-offset-2"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-[70] bg-white shadow-2xl border border-black/10 flex flex-col
                     inset-0 sm:inset-auto sm:bottom-5 sm:right-5
                     sm:w-[340px] sm:h-[520px] sm:rounded-lg overflow-hidden"
          role="dialog"
          aria-label="ProGrafter chat assistant"
        >
          {/* Header */}
          <div className="bg-[#27396A] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#14A8A1] flex items-center justify-center font-heading text-base">
                PG
              </div>
              <div className="leading-tight">
                <div className="font-heading text-base tracking-wide">Ask ProGrafter</div>
                <div className="text-[11px] text-white/70 font-mono">Usually answers in seconds</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-white/80 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FAFAF7]">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm rounded-2xl whitespace-pre-wrap leading-snug ${
                    m.role === "user"
                      ? "bg-[#14A8A1] text-white rounded-br-sm"
                      : "bg-white border border-black/5 text-[#27396A] rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-black/5 px-3 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#14A8A1] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#14A8A1] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#14A8A1] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Type picker */}
            {showTypePicker && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleTypePick("trade")}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#14A8A1] text-[#14A8A1] hover:bg-[#14A8A1] hover:text-white transition-colors"
                >
                  I'm a Tradesperson
                </button>
                <button
                  onClick={() => handleTypePick("homeowner")}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#14A8A1] text-[#14A8A1] hover:bg-[#14A8A1] hover:text-white transition-colors"
                >
                  I'm a Homeowner
                </button>
              </div>
            )}

            {/* Suggested questions */}
            {!loading && suggested.length > 0 && !showTypePicker && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggested.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs rounded-full border border-[#14A8A1] text-[#14A8A1] hover:bg-[#14A8A1] hover:text-white transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="border-t border-black/10 bg-white p-2 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm rounded-md border border-black/10 focus:outline-none focus:border-[#14A8A1] focus:ring-1 focus:ring-[#14A8A1] bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="h-9 w-9 rounded-md bg-[#14A8A1] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#0B7F74] transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
