import { useState } from "react";
import { Mail, Copy, Check, Send } from "lucide-react";
import { z } from "zod";
import AppShell from "@/components/AppShell";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255),
  subject: z.string().min(1, "Please select a subject"),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message must be under 2000 characters"),
});

const SUBJECT_OPTIONS = [
  "General Enquiry",
  "Homeowner Support",
  "Trade Support",
  "Report a Problem",
  "Press & Media",
  "Partnership Enquiry",
];

const CONTACT_CARDS = [
  {
    title: "General Enquiries",
    email: "hello@prografter.co.uk",
    subjectLine: "General Enquiry",
    description: "For general questions about ProGrafter",
    badge: "01",
  },
  {
    title: "Homeowner Support",
    email: "hello@prografter.co.uk",
    subjectLine: "Homeowner Support",
    description: "For homeowners with questions about their project or account",
    badge: "02",
  },
  {
    title: "Trade Support",
    email: "hello@prografter.co.uk",
    subjectLine: "Trade Support",
    description: "For trades needing help with registration or your account",
    badge: "03",
  },
  {
    title: "Report a Problem",
    email: "hello@prografter.co.uk",
    subjectLine: "Issue Report",
    description: "To report a technical problem or urgent issue",
    badge: "04",
  },
];

const Contact = () => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleCopy = async (email: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedIdx(idx);
      toast.success("Email copied to clipboard");
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Please check your input";
      toast.error(firstError);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          template: "contact-message",
          data: parsed.data,
          purpose: "transactional",
          replyTo: parsed.data.email,
        },
      });
      if (error) throw error;
      toast.success("Message sent — we'll be in touch within 24 hours.");
      trackEvent("contact_submit", { subject: parsed.data.subject });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form send failed:", err);
      toast.error("Could not send message. Please email hello@prografter.co.uk directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <SEO
        title="Contact ProGrafter | Get in Touch"
        description="Get in touch with the ProGrafter team. We respond to every enquiry within 5–7 days."
        path="/contact"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "ProGrafter Ltd",
          url: "https://prografter.co.uk/contact",
          email: "hello@prografter.co.uk",
          address: {
            "@type": "PostalAddress",
            addressRegion: "Nottinghamshire",
            addressCountry: "GB",
          },
          identifier: { "@type": "PropertyValue", propertyID: "Companies House", value: "17124130" },
          areaServed: { "@type": "Country", name: "United Kingdom" },
        }}
      />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              Contact
            </span>
          </div>
          <h1 className="font-heading text-navy text-[56px] craft:text-[88px] leading-[0.95] mb-6">
            GET IN<br />
            <span className="text-teal">TOUCH.</span>
          </h1>
          <p className="font-body text-body-text text-lg max-w-xl font-light">
            We aim to respond to all enquiries within 5–7 days.
          </p>
        </section>

        {/* Contact Cards */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="grid craft:grid-cols-2 gap-6">
            {CONTACT_CARDS.map((card, idx) => (
              <div
                key={card.title}
                className="bg-card border-2 border-navy/10 rounded-2xl p-6 flex flex-col hover:border-teal/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-teal" />
                  </div>
                  <span className="font-mono text-xs text-secondary-text">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-heading text-navy text-2xl mb-2 leading-tight">
                  {card.title}
                </h3>
                <p className="font-body text-body-text text-sm mb-4 flex-grow">
                  {card.description}
                </p>
                <div className="font-mono text-sm text-navy mb-1 break-all">
                  {card.email}
                </div>
                {card.subjectLine && (
                  <div className="font-mono text-xs text-secondary-text mb-4">
                    Subject: {card.subjectLine}
                  </div>
                )}
                <button
                  onClick={() => handleCopy(card.email, idx)}
                  title={card.subjectLine ? `Subject: ${card.subjectLine}` : undefined}
                  className="mt-auto flex items-center justify-center gap-2 border border-teal text-teal font-mono text-xs px-4 py-2.5 rounded-xl hover:bg-teal hover:text-cream transition-colors"
                >
                  {copiedIdx === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy with Subject
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="max-w-3xl mx-auto px-6 mb-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-teal" />
            <span className="font-mono text-xs text-teal uppercase tracking-widest">
              Send a Message
            </span>
          </div>
          <h2 className="font-body font-bold text-navy text-3xl craft:text-4xl mb-8">
            Drop us a line.
          </h2>

          <form onSubmit={handleSubmit} className="bg-card border-2 border-navy/10 rounded-2xl p-6 craft:p-8 space-y-5">
            <div className="grid craft:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block font-mono text-xs text-navy uppercase tracking-wider mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-cream border border-navy/15 rounded-xl px-4 py-3 font-body text-navy placeholder:text-secondary-text focus:outline-none focus:border-teal transition-colors"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block font-mono text-xs text-navy uppercase tracking-wider mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-cream border border-navy/15 rounded-xl px-4 py-3 font-body text-navy placeholder:text-secondary-text focus:outline-none focus:border-teal transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block font-mono text-xs text-navy uppercase tracking-wider mb-2">
                Subject *
              </label>
              <select
                id="subject"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-cream border border-navy/15 rounded-xl px-4 py-3 font-body text-navy focus:outline-none focus:border-teal transition-colors"
              >
                <option value="">Select a subject…</option>
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block font-mono text-xs text-navy uppercase tracking-wider mb-2">
                Message * <span className="text-secondary-text normal-case tracking-normal">(min 20 chars)</span>
              </label>
              <textarea
                id="message"
                required
                rows={6}
                minLength={20}
                maxLength={2000}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-cream border border-navy/15 rounded-xl px-4 py-3 font-body text-navy placeholder:text-secondary-text focus:outline-none focus:border-teal transition-colors resize-y"
                placeholder="Tell us what's on your mind…"
              />
              <p className="mt-1 font-mono text-xs text-secondary-text text-right">
                {form.message.length} / 2000
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full craft:w-auto inline-flex items-center justify-center gap-2 bg-teal text-cream font-mono text-sm px-8 py-3.5 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-teal/20"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Sending…" : "Send Message"}
            </button>
          </form>
        </section>

        {/* Company Details */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="bg-navy text-cream rounded-2xl p-8 craft:p-12 relative overflow-hidden">
            <span className="absolute -bottom-6 -right-2 font-heading text-[140px] craft:text-[200px] text-cream/[0.04] select-none pointer-events-none leading-none">
              CO.
            </span>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-[2px] bg-teal" />
                <span className="font-mono text-xs text-teal uppercase tracking-widest">
                  Company Details
                </span>
              </div>
              <h2 className="font-heading text-cream text-3xl craft:text-4xl mb-8">
                ProGrafter Ltd
              </h2>
              <dl className="grid craft:grid-cols-2 gap-x-12 gap-y-4 font-mono text-sm">
                <div>
                  <dt className="text-secondary-text uppercase tracking-wider text-xs mb-1">
                    Registration
                  </dt>
                  <dd className="text-cream">Registered in England and Wales</dd>
                </div>
                <div>
                  <dt className="text-secondary-text uppercase tracking-wider text-xs mb-1">
                    Companies House
                  </dt>
                  <dd className="text-cream">
                    17124130
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary-text uppercase tracking-wider text-xs mb-1">
                    Registered Office
                  </dt>
                  <dd className="text-cream">Nottinghamshire, UK — full registered address available on request</dd>
                </div>
                <div>
                  <dt className="text-secondary-text uppercase tracking-wider text-xs mb-1">
                    ICO Registration
                  </dt>
                  <dd className="text-cream">
                    ZC114018
                  </dd>
                </div>
                <div className="craft:col-span-2">
                  <dt className="text-secondary-text uppercase tracking-wider text-xs mb-1">
                    Email
                  </dt>
                  <dd>
                    <a
                      href="mailto:hello@prografter.co.uk"
                      className="text-teal hover:underline"
                    >
                      hello@prografter.co.uk
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>

    </AppShell>
  );
};

export default Contact;
