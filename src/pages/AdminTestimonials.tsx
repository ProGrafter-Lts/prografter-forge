import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { TestimonialCard, type Testimonial } from "@/components/Testimonials";

type Row = Testimonial & { approved: boolean; created_at: string };

const empty = {
  quote: "",
  author_first_name: "",
  author_trade_or_role: "",
  author_photo_url: "",
  rating: "" as string,
};

const AdminTestimonials = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState(empty);
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
    setSaving(true);
    const ratingNum = form.rating ? Number(form.rating) : null;
    const { error } = await supabase.from("testimonials").insert({
      quote: form.quote.trim(),
      author_first_name: form.author_first_name.trim(),
      author_trade_or_role: form.author_trade_or_role.trim(),
      author_photo_url: form.author_photo_url.trim() || null,
      rating: ratingNum && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : null,
      approved: false,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Testimonial added (unapproved)");
    setForm(empty);
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
      load();
    }
  };

  const previewT: Testimonial = {
    id: "preview",
    quote: form.quote || "Your quote will appear here…",
    author_first_name: form.author_first_name || "First name",
    author_trade_or_role: form.author_trade_or_role || "Role, Town",
    author_photo_url: form.author_photo_url || null,
    rating: form.rating ? Number(form.rating) : null,
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO title="Admin · Testimonials — ProGrafter" description="Manage homepage testimonials." path="/admin/testimonials" noindex />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-navy text-4xl">Testimonials</h1>
          <Link to="/admin/verifications" className="font-mono text-xs text-teal underline">
            ← Admin
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <form onSubmit={submit} className="rounded-md border border-border bg-background p-6 space-y-4">
            <h2 className="font-heading text-2xl text-navy">Add new</h2>

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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="photo">Photo URL (optional)</Label>
                <Input
                  id="photo"
                  type="url"
                  value={form.author_photo_url}
                  onChange={(e) => setForm({ ...form, author_photo_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1–5, optional)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add testimonial"}
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
                  <p className="font-body text-navy text-sm line-clamp-2">“{r.quote}”</p>
                  <p className="font-mono text-xs text-secondary-text mt-1">
                    {r.author_first_name} · {r.author_trade_or_role}
                    {r.rating ? ` · ${r.rating}★` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={r.approved}
                      onCheckedChange={(v) => toggleApproved(r.id, v)}
                      id={`appr-${r.id}`}
                    />
                    <Label htmlFor={`appr-${r.id}`} className="text-xs font-mono">
                      {r.approved ? "Published" : "Hidden"}
                    </Label>
                  </div>
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
