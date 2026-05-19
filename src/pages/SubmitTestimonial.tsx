import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SEO from "@/components/SEO";

const schema = z.object({
  firstName: z.string().trim().min(1, "Please add your first name").max(80),
  town: z.string().trim().max(80).optional().or(z.literal("")),
  quote: z.string().trim().min(10, "Please write at least 10 characters").max(280),
  rating: z.number().int().min(1).max(5).optional(),
});

const SubmitTestimonial = () => {
  const [params] = useSearchParams();
  const presetFirst = params.get("first") ?? "";
  const presetContractId = params.get("c") ?? null;
  const presetProject = params.get("p") ?? "";

  const [firstName, setFirstName] = useState(presetFirst);
  const [town, setTown] = useState("");
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPostJob = Boolean(presetContractId || presetProject);
  const heading = isPostJob && presetFirst
    ? `Quick favour, ${presetFirst}`
    : "Quick favour";
  const body = isPostJob && presetProject
    ? `How was your experience with ${presetProject} on ProGrafter? A few words helps the next homeowner or trade trust the platform.`
    : "Would you say a few words about your experience? It helps the next homeowner or trade trust the platform.";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      firstName,
      town,
      quote,
      rating: rating ?? undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete the form");
      return;
    }
    setSaving(true);
    const { error } = await supabase.functions.invoke("submit-testimonial", {
      body: {
        first_name: parsed.data.firstName,
        town: parsed.data.town || "",
        quote: parsed.data.quote,
        rating: parsed.data.rating ?? null,
        contract_id: presetContractId,
      },
    });
    setSaving(false);
    if (error) {
      toast.error("Could not submit — please try again");
      return;
    }
    setSubmitted(true);
  };

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
      <SEO
        title="Share your experience — ProGrafter"
        description="Tell us about your experience using ProGrafter."
        path="/share-your-experience"
        noindex
      />
      <div className="max-w-lg w-full">
        {submitted ? (
          <div className="rounded-md border border-border bg-background p-8 text-center">
            <h1 className="font-heading text-3xl text-navy mb-3">Thank you</h1>
            <p className="font-body text-secondary-text">
              We'll review your words and be in touch if we'd like to feature them.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-md border border-border bg-background p-8 space-y-5">
            <div>
              <h1 className="font-heading text-3xl text-navy mb-1">{heading}</h1>
              <p className="font-body text-secondary-text text-sm">{body}</p>
            </div>

            <div className="space-y-2">
              <Label>Rating (optional)</Label>
              <div
                className="flex gap-1"
                role="radiogroup"
                aria-label="Rate your experience: 1 to 5 stars"
                onMouseLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = n <= displayRating;
                  return (
                    <button
                      type="button"
                      key={n}
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setRating(rating === n ? null : n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onFocus={() => setHoverRating(n)}
                      onBlur={() => setHoverRating(null)}
                      className="p-1 rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${filled ? "fill-teal text-teal" : "text-border hover:text-teal"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote">
                Your words <span className="text-destructive">*</span>{" "}
                <span className="text-xs text-secondary-text font-normal">(max 280 chars)</span>
              </Label>
              <Textarea
                id="quote"
                maxLength={280}
                rows={4}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                required
              />
              <p className="text-xs text-secondary-text font-mono">{quote.length}/280</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="town">
                  Town <span className="text-xs text-secondary-text font-normal">(optional)</span>
                </Label>
                <Input
                  id="town"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-teal hover:bg-teal/90 text-cream"
            >
              {saving ? "Sending…" : "Send"}
            </Button>
            <p className="font-mono text-[11px] text-secondary-text">
              Nothing is published until Lee reviews it. This is a platform testimonial — separate from the job-completion review you leave for your trade or homeowner.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitTestimonial;
