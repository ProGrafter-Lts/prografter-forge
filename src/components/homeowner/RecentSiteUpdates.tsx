import { Clock, Image } from "lucide-react";

interface StageUpdate {
  id: string;
  update_text: string;
  created_at: string;
  photo_urls: string[] | null;
  trade_name?: string;
  stage_name?: string;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const RecentSiteUpdates = ({ updates }: { updates: StageUpdate[] }) => {
  return (
    <section>
      <h2 className="font-heading text-primary text-2xl mb-4">Recent Site Updates</h2>
      {updates.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-border text-center">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-sm text-muted-foreground">No site updates yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <div key={u.id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {u.trade_name && (
                      <span className="font-mono text-sm text-primary font-medium">{u.trade_name}</span>
                    )}
                    {u.stage_name && (
                      <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                        {u.stage_name}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground line-clamp-2">{u.update_text}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {(u.photo_urls?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-1">
                      {u.photo_urls!.slice(0, 2).map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Update"
                          className="w-10 h-10 rounded-lg object-cover border border-border"
                        />
                      ))}
                      {u.photo_urls!.length > 2 && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                          <Image className="w-3 h-3" />+{u.photo_urls!.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {timeAgo(u.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentSiteUpdates;
