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

const CATEGORIES = [
  { value: "scaffolding", label: "Scaffolding" },
  { value: "plant_skip_hire", label: "Plant / Skip Hire" },
  { value: "specialist_service", label: "Specialist Service" },
] as const;

const SPECIALIST_TYPES = [
  "Asbestos removal",
  "Roofing access",
  "Crane hire",
  "Demolition",
  "Structural surveying",
  "Other",
];

const schema = z.object({
  business_name: z.string().trim().min(1, "Required").max(200),
  contact_name: z.string().trim().min(1, "Required").max(200),
  email: z.string().trim().email("Enter a valid email").max(320),
  phone: z.string().trim().min(5, "Required").max(40),
  category: z.enum(["scaffolding", "plant_skip_hire", "specialist_service"]),
  specialist_type: z.string().trim().max(100).optional(),
  postcode: z.string().trim().min(1, "Required").max(20),
  service_area: z.string().trim().max(500).optional(),
  years_trading: z.number().int().min(0).max(200),
  has_public_liability: z.boolean(),
  public_liability_amount: z.string().trim().max(50).optional(),
  website: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const Suppliers = () => {
  const [form, setForm] = useState({
    business_name: "",
    contact_name: "",
    email: "",
    phone: "",
    category: "scaffolding" as "scaffolding" | "plant_skip_hire" | "specialist_service",
    specialist_type: "",
    postcode: "",
    service_area: "",
    years_trading: "",
    has_public_liability: false,
    public_liability_amount: "",
    website: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({
      ...form,
      years_trading: Number(form.years_trading || 0),
      specialist_type: form.category === "specialist_service" ? form.specialist_type : undefined,
      public_liability_amount: form.has_public_liability ? form.public_liability_amount : undefined,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) e[String(i.path[0])] = i.message;
      });
      setErrors(e);
      toast.error("Please fix the highlighted fields");
      return;
    }
    if (form.category === "specialist_service" && !form.specialist_type.trim()) {
      setErrors({ specialist_type: "Tell us what specialism" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("supplier_interest").insert({
      business_name: parsed.data.business_name,
      contact_name: parsed.data.contact_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      category: parsed.data.category,
      specialist_type: parsed.data.specialist_type || null,
      postcode: parsed.data.postcode,
      service_area: parsed.data.service_area || "",
      years_trading: parsed.data.years_trading,
      has_public_liability: parsed.data.has_public_liability,
      public_liability_amount: parsed.data.public_liability_amount || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
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
        title="For Suppliers — ProGrafter"
        description="Scaffolders, plant/skip hire and specialist services — register interest in supplying ProGrafter's trades."
        path="/suppliers"
      />
      <Navbar />
      <main className="flex-1">
        <section className="bg-deep text-cream px-6 py-16 md:py-20">
          <div className="max-w-3xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-widest text-teal mb-3">
              For suppliers
            </p>
            <h1 className="font-heading text-cream text-[44px] md:text-[72px] leading-[0.95] tracking-wider uppercase mb-4">
              Supply the trades on <span className="text-teal">ProGrafter</span>
            </h1>
            <p className="font-body text-lg text-cream/80 max-w-2xl">
              We're building a small, trusted panel of scaffolders, plant/skip hire and specialist
              services for our verified trades. Register your interest below — Lee will be in touch
              personally as we grow our trade network.
            </p>
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto">
            {done ? (
              <div className="bg-white rounded-2xl border border-navy/10 p-8 text-center">
                <h2 className="font-heading text-3xl text-navy mb-3">Thanks — got it.</h2>
                <p className="font-body text-body-text mb-2">
                  Lee will be in touch personally as Phase B opens.
                </p>
                <p className="font-body text-secondary-text text-sm">
                  We're keeping this list small and focused — no spam, no auto-emails.
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
                    <Label htmlFor="contact_name">Your name *</Label>
                    <Input
                      id="contact_name"
                      value={form.contact_name}
                      onChange={(e) => update("contact_name", e.target.value)}
                      className="mt-1"
                    />
                    {errors.contact_name && <p className="text-xs text-red-600 mt-1">{errors.contact_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className="mt-1"
                    />
                    {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
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

                <div>
                  <Label>Category *</Label>
                  <div className="mt-2 grid sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => update("category", c.value)}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border font-mono text-xs uppercase tracking-wider transition-colors ${
                          form.category === c.value
                            ? "bg-navy text-white border-navy"
                            : "bg-white text-navy border-navy/15 hover:bg-navy/5"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.category === "specialist_service" && (
                  <div>
                    <Label htmlFor="specialist_type">Specialism *</Label>
                    <select
                      id="specialist_type"
                      value={form.specialist_type}
                      onChange={(e) => update("specialist_type", e.target.value)}
                      className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select…</option>
                      {SPECIALIST_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.specialist_type && <p className="text-xs text-red-600 mt-1">{errors.specialist_type}</p>}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      value={form.postcode}
                      onChange={(e) => update("postcode", e.target.value.toUpperCase())}
                      className="mt-1 font-mono"
                    />
                    {errors.postcode && <p className="text-xs text-red-600 mt-1">{errors.postcode}</p>}
                  </div>
                  <div>
                    <Label htmlFor="years_trading">Years trading *</Label>
                    <Input
                      id="years_trading"
                      type="number"
                      min={0}
                      value={form.years_trading}
                      onChange={(e) => update("years_trading", e.target.value)}
                      className="mt-1 font-mono"
                    />
                    {errors.years_trading && <p className="text-xs text-red-600 mt-1">{errors.years_trading}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="service_area">Service area (areas / radius covered)</Label>
                  <Input
                    id="service_area"
                    value={form.service_area}
                    onChange={(e) => update("service_area", e.target.value)}
                    placeholder="e.g. M25 area, 20 miles around Bromley"
                    className="mt-1"
                  />
                </div>

                <div className="rounded-xl border border-navy/10 p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.has_public_liability}
                      onChange={(e) => update("has_public_liability", e.target.checked)}
                      className="mt-1 h-5 w-5 accent-teal"
                    />
                    <div>
                      <div className="font-body text-sm font-medium text-navy">
                        I hold valid Public Liability insurance
                      </div>
                      <div className="font-body text-xs text-secondary-text">
                        Required to qualify for Phase B.
                      </div>
                    </div>
                  </label>
                  {form.has_public_liability && (
                    <div>
                      <Label htmlFor="pl_amount">Cover amount</Label>
                      <Input
                        id="pl_amount"
                        value={form.public_liability_amount}
                        onChange={(e) => update("public_liability_amount", e.target.value)}
                        placeholder="e.g. £5m"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => update("website", e.target.value)}
                    placeholder="https://"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Anything else (optional)</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="Specialisms, plant/equipment, capacity, anything Lee should know."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-teal hover:bg-teal/90 text-white font-mono uppercase tracking-wider min-h-[48px]"
                >
                  {submitting ? "Submitting…" : "Register interest"}
                </Button>
                <p className="font-mono text-[11px] text-secondary-text text-center">
                  No spam. No auto-emails. Lee contacts each supplier personally.
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
