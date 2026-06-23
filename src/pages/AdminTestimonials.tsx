import { useEffect, useState } from "react";

import { toast } from "sonner";
import { Star, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SEO from "@/components/SEO";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { TestimonialCard, type Testimonial } from "@/components/Testimonials";

type Row = Testimonial & { approved: boolean; created_at: string };

const empty = {
  quote: "",
  author_first_name: "",
  author_trade_or_role: "",
  author_photo_url: "",
  rating: null as number | null,
  publish: false,
};

// Validate that a URL points to a real image
const validateImageUrl = (url: string): Promise<boolean> =>
  new Promise((resolve) => {
    if (!url) return resolve(true); // empty is fine (optional)
    if (!/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(url)) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Safety timeout
    setTimeout(() => resolve(false), 6000);
  });

const AdminTestimonials = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("id, quote, author_first_name, author_trade_or_role, author_photo_url, rating, approved, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load testimonials");
      return;
    }
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(empty);
    setEditingId(null);
  };

  const beginEdit = (r: Row) => {
    setEditingId(r.id);
    setForm({
      quote: r.quote,
      author_first_name: r.author_first_name,
      author_trade_or_role: r.author_trade_or_role,
      author_photo_url: r.author_photo_url ?? "",
      rating: r.rating ?? null,
      publish: r.approved,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quote.trim() || form.quote.length > 280) {
      toast.error("Quote must be 1–280 characters");
      return;
    }
    if (!form.author_first_name.trim() || !form.author_trade_or_role.trim()) {
      toast.error("First name and role are required");
      return;
    }
    if (form.rating !== null && (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5)) {
      toast.error("Rating must be a whole number between 1 and 5");
      return;
    }

    setSaving(true);
    const photoUrl = form.author_photo_url.trim();
    if (photoUrl) {
      const ok = await validateImageUrl(photoUrl);
      if (!ok) {
        setSaving(false);
        toast.error("This URL doesn't appear to be an image. Check the link and try again.");
        return;
      }
    }

    const payload = {
      quote: form.quote.trim(),
      author_first_name: form.author_first_name.trim(),
      author_trade_or_role: form.author_trade_or_role.trim(),
      author_photo_url: photoUrl || null,
      rating: form.rating,
      approved: form.publish,
    };

    const { error } = editingId
      ? await supabase.from("testimonials").update(payload).eq("id", editingId)
      : await supabase.from("testimonials").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      editingId
        ? "Testimonial updated"
        : form.publish
          ? "Testimonial added & published"
          : "Testimonial saved as draft"
    );
    resetForm();
    load();
  };

  const toggleApproved = async (id: string, next: boolean) => {
    const { error } = await supabase.from("testimonials").update({ approved: next }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "Published" : "Unpublished");
      load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      if (editingId === id) resetForm();
      load();
    }
  };

  const previewT: Testimonial = {
    id: "preview",
    quote: form.quote || "Your quote will appear here…",
    author_first_name: form.author_first_name || "First name",
    author_trade_or_role: form.author_trade_or_role || "Role, Town",
    author_photo_url: form.author_photo_url || null,
    rating: form.rating,
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Admin · Testimonials — ProGrafter" description="Manage homepage testimonials." path="/admin/testimonials" noindex />
      <AdminPageHeader
        title="Testimonials"
        subtitle="Review, edit and publish homepage testimonials."
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <form onSubmit={submit} className="rounded-md border border-border bg-background p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl text-navy">
                {editingId ? "Edit testimonial" : "Add new"}
              </h2>
              {editingId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4 mr-1" /> Cancel edit
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote">Quote (max 280 chars)</Label>
              <Textarea
                id="quote"
                maxLength={280}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                rows={4}
                required
              />
              <p className="text-xs text-secondary-text font-mono">{form.quote.length}/280</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="first">First name</Label>
                <Input
                  id="first"
                  value={form.author_first_name}
                  onChange={(e) => setForm({ ...form, author_first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role / Town</Label>
                <Input
                  id="role"
                  placeholder="Electrician, Mansfield"
                  value={form.author_trade_or_role}
                  onChange={(e) => setForm({ ...form, author_trade_or_role: e.target.value })}
                  required
                />
                <p className="text-[11px] text-secondary-text font-mono leading-snug">
                  Format: Trade type, Town — e.g. Electrician, Mansfield<br />
                  Or: Homeowner, Beeston
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Photo URL (optional)</Label>
              <Input
                id="photo"
                type="url"
                placeholder="https://… ending in .jpg, .png or .webp"
                value={form.author_photo_url}
                onChange={(e) => setForm({ ...form, author_photo_url: e.target.value })}
              />
              <p className="text-[11px] text-secondary-text font-mono">
                URL is verified to resolve to a real image before saving.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Rating (optional)</Label>
              <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating: 1 to 5 stars">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = form.rating !== null && n <= form.rating;
                  return (
                    <button
                      type="button"
                      key={n}
                      role="radio"
                      aria-checked={form.rating === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      onClick={() => setForm({ ...form, rating: form.rating === n ? null : n })}
                      className="p-1 rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                    >
                      <Star className={`h-6 w-6 ${filled ? "fill-teal text-teal" : "text-border"}`} />
                    </button>
                  );
                })}
                {form.rating !== null && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, rating: null })}
                    className="ml-2 text-xs font-mono text-secondary-text underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-2 border-t border-border">
              <Checkbox
                id="publish"
                checked={form.publish}
                onCheckedChange={(v) => setForm({ ...form, publish: v === true })}
                className="mt-0.5"
              />
              <span className="text-sm font-body text-navy">
                Publish to site{" "}
                <span className="text-secondary-text text-xs">
                  (leave unchecked to save as draft)
                </span>
              </span>
            </label>

            <Button
              type="submit"
              disabled={saving}
              className="bg-teal hover:bg-teal/90 text-cream"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add testimonial"}
            </Button>
          </form>

          <div>
            <h2 className="font-heading text-2xl text-navy mb-4">Live preview</h2>
            <TestimonialCard t={previewT} />
          </div>
        </div>

        <h2 className="font-heading text-2xl text-navy mb-4">All testimonials ({rows.length})</h2>
        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="font-body text-secondary-text">No testimonials yet.</p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="rounded-md border border-border bg-background p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${
                        r.approved ? "bg-teal text-cream" : "bg-border text-navy"
                      }`}
                    >
                      {r.approved ? "Published" : "Draft"}
                    </span>
                    {r.rating ? (
                      <span className="font-mono text-xs text-secondary-text">{r.rating}★</span>
                    ) : null}
                  </div>
                  <p className="font-body text-navy text-sm line-clamp-2">“{r.quote}”</p>
                  <p className="font-mono text-xs text-secondary-text mt-1">
                    {r.author_first_name} · {r.author_trade_or_role}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={r.approved}
                      onCheckedChange={(v) => toggleApproved(r.id, v)}
                      id={`appr-${r.id}`}
                    />
                    <Label htmlFor={`appr-${r.id}`} className="text-xs font-mono">
                      {r.approved ? "Live" : "Hidden"}
                    </Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => beginEdit(r)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes the testimonial. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTestimonials;
