import { useNavigate } from "react-router-dom";
import { Bell, BellRing, Clock, Hourglass, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTradeNotifications, type TradeNotification } from "@/hooks/useTradeNotifications";
import { cn } from "@/lib/utils";

const iconFor = (type: string) => {
  if (type === "lead_reminder") return Hourglass;
  if (type === "lead_expired") return Clock;
  if (type === "new_lead") return Sparkles;
  return Bell;
};

const timeAgo = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { items, unreadCount, markRead, markAllRead } = useTradeNotifications();

  const open = (n: TradeNotification) => {
    markRead(n.id);
    if (!n.link) return;
    if (n.link.startsWith("http")) window.location.href = n.link;
    else navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          className="relative rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {unreadCount > 0 ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[380px]">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read_at && "bg-primary/5",
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", !n.read_at ? "text-primary" : "text-muted-foreground")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{n.title}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{n.body}</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
