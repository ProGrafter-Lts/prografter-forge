import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const SUPPLIER_TYPES = [
  "Muck-away / grab / skip",
  "Aggregates",
  "Plant & tool hire",
  "Builders' merchant",
  "Materials supplier",
  "Ready-mix concrete",
  "Scaffold",
  "Waste carrier",
  "Other",
] as const;

const schema = z.object({
  business_name: z.string().trim().min(1, "Required").max(200),
  contact_name: z.string().trim().max(200).optional(),
  email: z.string().trim().email("Enter a valid email").max(320),
  phone: z.string().trim().max(40).optional(),
  postcode: z.string().trim().max(20).optional(),
  service_area: z.string().trim().max(500).optional(),
  supplier_types: z.array(z.string()).max(20),
  also_a_trade: z.boolean(),
  trade_type: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Please tick to continue" }) }),
});

const Suppliers = () => {
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    postcode: "",
    service_area: "",
    supplier_types: [] as string[],
    also_a_trade: false,
    trade_type: "",
    notes: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleType = (t: string) =>
    setForm((f) => ({
      ...f,
      supplier_types: f.supplier_types.includes(t)
        ? f.supplier_types.filter((x) => x !== t)
        : [...f.supplier_types, t],
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("supplier_waitlist").insert({
      business_name: parsed.data.business_name,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      postcode: parsed.data.postcode || null,
      service_area: parsed.data.service_area || null,
      supplier_types: parsed.data.supplier_types,
      also_a_trade: parsed.data.also_a_trade,
      trade_type: parsed.data.also_a_trade ? parsed.data.trade_type || null : null,
      notes: parsed.data.notes || null,
      consent: parsed.data.consent,
      source: "website",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit — please try again");
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <SEO
        title="Supplier Waitlist — ProGrafter"
        description="Builders' merchants, plant/tool hire, aggregates, muck-away, ready-mix, scaffold and waste carriers — join the ProGrafter supplier waitlist."
        path="/suppliers"
      />
      <Navbar />
      <main className="flex-1">
        <section className="bg-deep text-cream px-6 py-16 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-teal mb-3">
              Coming soon · Supplier waitlist
            </p>
            <h1 className="font-heading text-cream text-[44px] md:text-[72px] leading-[0.95] tracking-wider uppercase mb-4">
              Supply the trades on <span className="text-teal">ProGrafter</span>
            </h1>
            <p className="font-body text-lg text-cream/80 max-w-2xl">
              We're opening a supplier side of ProGrafter. Suppliers — builders' merchants,
              plant &amp; tool hire, aggregates, muck-away / grab / skip, ready-mix, scaffold,
              materials and waste carriers — can join the waitlist to be invited when it launches.
              It's coming soon and we're not promising a date — but join now and you'll be
              first in line.
            </p>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            {done ? (
              <div className="bg-white rounded-2xl border border-navy/10 p-8 text-center">
                <h2 className="font-heading text-3xl text-navy mb-3">You're on the list.</h2>
                <p className="font-body text-body-text mb-2">
                  Thanks for registering your interest. We'll be in touch when the ProGrafter
                  supplier side opens.
                </p>
                <p className="font-body text-secondary-text text-sm">
                  No date promised — but you'll be among the first we invite.
                </p>
                <Link
                  to="/"
                  className="inline-block mt-6 font-mono text-xs uppercase tracking-widest text-teal hover:underline"
                >
                  ← Back to home
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-navy/10 p-6 md:p-8 space-y-5">
                <div>
                  <Label htmlFor="business_name">Business name *</Label>
                  <Input
                    id="business_name"
                    value={form.business_name}
                    onChange={(e) => update("business_name", e.target.value)}
                    className="mt-1"
                  />
                  {errors.business_name && <p className="text-xs text-red-600 mt-1">{errors.business_name}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Contact name</Label>
                    <Input
                      id="contact_name"
                      value={form.contact_name}
                      onChange={(e) => update("contact_name", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="mt-1"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postcode">Postcode (service base)</Label>
                    <Input
                      id="postcode"
                      value={form.postcode}
                      onChange={(e) => update("postcode", e.target.value.toUpperCase())}
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service_area">Service area / radius covered</Label>
                    <Input
                      id="service_area"
                      value={form.service_area}
                      onChange={(e) => update("service_area", e.target.value)}
                      placeholder="e.g. 20 miles around Bromley"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Supplier type</Label>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {SUPPLIER_TYPES.map((t) => {
                      const active = form.supplier_types.includes(t);
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => toggleType(t)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl border font-body text-sm text-left transition-colors ${
                            active
                              ? "bg-navy text-white border-navy"
                              : "bg-white text-navy border-navy/15 hover:bg-navy/5"
                          }`}
                        >
                          <span className="mr-2">{active ? "✓" : "+"}</span>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-navy/10 p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.also_a_trade}
                      onChange={(e) => update("also_a_trade", e.target.checked)}
                      className="mt-1 h-5 w-5 accent-teal"
                    />
                    <div className="font-body text-sm font-medium text-navy">
                      I'm also a trade and want to quote on jobs now
                    </div>
                  </label>
                  {form.also_a_trade && (
                    <div className="space-y-3 pl-8">
                      <div>
                        <Label htmlFor="trade_type">What's your trade?</Label>
                        <Input
                          id="trade_type"
                          value={form.trade_type}
                          onChange={(e) => update("trade_type", e.target.value)}
                          placeholder="e.g. Groundworks, Bricklayer"
                          className="mt-1"
                        />
                      </div>
                      <Link
                        to="/register/trade"
                        className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-teal hover:bg-teal/90 text-white font-mono text-xs uppercase tracking-wider"
                      >
                        Register as a trade →
                      </Link>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">What do you supply / notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="Tell us what you supply, capacity, anything useful."
                  />
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => update("consent", e.target.checked)}
                      className="mt-1 h-5 w-5 accent-teal"
                    />
                    <span className="font-body text-sm text-body-text">
                      I agree to ProGrafter contacting me about the supplier waitlist and storing
                      my details per the{" "}
                      <Link to="/privacy" className="text-teal underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.consent && <p className="text-xs text-red-600 mt-1">{errors.consent}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal hover:bg-teal/90 text-white font-mono uppercase tracking-wider min-h-[48px]"
                >
                  {submitting ? "Submitting…" : "Join the supplier waitlist"}
                </Button>
                <p className="font-mono text-[11px] text-secondary-text text-center">
                  Coming soon — no date promised. We'll invite you when the supplier side opens.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Suppliers;
