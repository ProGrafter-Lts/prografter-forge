import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Button } from "@/components/ui/button";

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
        <Button
          onClick={() => setOpen(true)}
          aria-label="Open ProGrafter chat assistant"
          variant="cta"
          size="icon"
          className="fixed bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+1rem))] right-4 z-30 h-12 w-12 rounded-full shadow-lg sm:bottom-5 sm:right-5 sm:h-[55px] sm:w-[55px]"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
        </Button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex h-[100dvh] min-h-0 flex-col overflow-hidden border border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[520px] sm:w-[340px] sm:rounded-lg sm:pb-0"
          role="dialog"
          aria-label="ProGrafter chat assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-navy-deep px-4 py-3 text-cream">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal font-heading text-base">
                PG
              </div>
              <div className="leading-tight">
                <div className="font-heading text-base tracking-wide">Ask ProGrafter</div>
                <div className="font-mono text-[11px] text-cream/70">Usually answers in seconds</div>
              </div>
            </div>
            <Button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              variant="ghost"
              size="icon"
              className="text-cream/80 hover:bg-cream/10 hover:text-cream"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm rounded-2xl whitespace-pre-wrap leading-snug ${
                    m.role === "user"
                      ? "bg-teal text-cream rounded-br-sm"
                      : "bg-card border border-border text-navy-deep rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Type picker */}
            {showTypePicker && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={() => handleTypePick("trade")}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-teal text-xs text-teal hover:bg-teal hover:text-cream"
                >
                  I'm a Tradesperson
                </Button>
                <Button
                  onClick={() => handleTypePick("homeowner")}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-teal text-xs text-teal hover:bg-teal hover:text-cream"
                >
                  I'm a Homeowner
                </Button>
              </div>
            )}

            {/* Suggested questions */}
            {!loading && suggested.length > 0 && !showTypePicker && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggested.map((q) => (
                  <Button
                    key={q}
                    onClick={() => sendMessage(q)}
                    variant="outline"
                    size="sm"
                    className="h-auto whitespace-normal rounded-full border-teal py-1.5 text-left text-xs text-teal hover:bg-teal hover:text-cream"
                  >
                    {q}
                  </Button>
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
            className="flex items-center gap-2 border-t border-border bg-card p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              disabled={loading}
              className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              variant="cta"
              size="icon"
              className="h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;
