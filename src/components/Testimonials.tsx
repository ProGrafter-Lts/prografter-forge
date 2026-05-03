import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  quote: string;
  author_first_name: string;
  author_trade_or_role: string;
  author_photo_url: string | null;
  rating: number | null;
}

export const TestimonialCard = ({ t }: { t: Testimonial }) => (
  <article className="rounded-md border border-border bg-background p-6 flex flex-col gap-4">
    {t.rating ? (
      <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-4 w-4 ${n <= (t.rating ?? 0) ? "fill-teal text-teal" : "text-border"}`}
            strokeWidth={1.5}
          />
        ))}
      </div>
    ) : null}
    <p className="font-body text-[18px] leading-relaxed text-navy">
      “{t.quote}”
    </p>
    <div className="flex items-center gap-3 mt-auto pt-2">
      {t.author_photo_url ? (
        <img
          src={t.author_photo_url}
          alt=""
          className="h-9 w-9 rounded-full object-cover"
          loading="lazy"
        />
      ) : null}
      <div className="text-[13px] font-body text-secondary-text">
        <span className="font-semibold text-navy">{t.author_first_name}</span>
        <span> · {t.author_trade_or_role}</span>
      </div>
    </div>
  </article>
);

const Testimonials = () => {
  const [items, setItems] = useState<Testimonial[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id, quote, author_first_name, author_trade_or_role, author_photo_url, rating")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(9);
      if (mounted) setItems(data ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-cream" aria-labelledby="testimonials-heading">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-[2px] bg-teal" />
          <span className="font-mono text-xs text-teal uppercase tracking-widest">
            Real Users
          </span>
        </div>
        <h2
          id="testimonials-heading"
          className="font-heading text-navy text-[40px] md:text-[56px] leading-[0.95] mb-12"
        >
          WHAT REAL USERS SAY
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
