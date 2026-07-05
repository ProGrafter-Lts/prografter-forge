import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";

// UK postcode regex (loose — accepts standard formats with or without space)
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const schema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters"),
  postcode: z.string().trim().regex(UK_POSTCODE, "Enter a valid UK postcode"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  agreedTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to continue" }) }),
  marketingOptIn: z.boolean(),
});

type FormState = {
  fullName: string;
  email: string;
  password: string;
  postcode: string;
  phone: string;
  agreedTerms: boolean;
  marketingOptIn: boolean;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  password: "",
  postcode: "",
  phone: "",
  agreedTerms: false,
  marketingOptIn: false,
};

const SignupHomeowner = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard/homeowner`,
          data: {
            user_type: "homeowner",
            full_name: form.fullName,
            postcode: form.postcode.toUpperCase(),
            phone: form.phone || "",
          },
        },
      });

      if (signUpError) {
        setServerError(signUpError.message);
        setSubmitting(false);
        return;
      }

      const userId = signUpData.user?.id;
      if (userId) {
        // Capture consent (best-effort — failure here doesn't block signup)
        try {
          const userAgent = navigator.userAgent;
          await supabase.from("consents_log").insert([
            {
              user_id: userId,
              consent_type: "terms",
              consented: true,
              user_agent: userAgent,
            },
            {
              user_id: userId,
              consent_type: "marketing",
              consented: form.marketingOptIn,
              user_agent: userAgent,
            },
          ]);
        } catch {
          // non-blocking
        }
      }

      // Welcome email (best-effort — failure must not block signup)
      if (userId) {
        try {
          const firstName = form.fullName.trim().split(/\s+/)[0] || "";
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "homeowner-welcome",
              recipientEmail: form.email,
              idempotencyKey: `homeowner-welcome-${userId}`,
              templateData: { firstName },
            },
          });
        } catch (e) {
          console.warn("homeowner-welcome email failed (non-blocking)", e);
        }
      }

      // If a session was returned (auto-confirm on), go to next-step page.
      // Otherwise show check-inbox.
      trackEvent("sign_up", { method: "homeowner" });
      if (signUpData.session) {
        navigate("/signup/homeowner/next", { replace: true });
      } else {
        navigate("/signup/homeowner/check-email", { replace: true, state: { email: form.email } });
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <SEO
        title="Sign up as a homeowner — ProGrafter"
        description="Create your free ProGrafter account and get matched with up to three vetted, local, available UK trades — never broadcast to everyone."
        path="/signup/homeowner"
      />
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <span className="font-mono text-xs text-teal uppercase tracking-widest">For Homeowners</span>
            <h1 className="font-heading text-navy text-4xl craft:text-5xl mt-2">Create your account</h1>
            <p className="font-body text-secondary-text mt-3">
              Free to post. No deposit. Up to three matched trades — not thirty — all vetted, local, and actually available.
            </p>
          </div>

          <TrustSignal tone="dark" className="mb-6" text="Verified homeowners. Human-reviewed briefs. Up to 3 matched trades." />


          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy/10 p-6 craft:p-8 shadow-sm space-y-5">
            <Field label="Full name" error={errors.fullName} required>
              <input
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Email" error={errors.email} required>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Password" error={errors.password} required hint="At least 8 characters">
              <input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Postcode" error={errors.postcode} required>
              <input
                type="text"
                autoComplete="postal-code"
                value={form.postcode}
                onChange={(e) => update("postcode", e.target.value)}
                className="input uppercase"
                placeholder="e.g. NG1 1AA"
              />
            </Field>

            <Field label="Phone number (optional)" error={errors.phone}>
              <input
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input"
              />
            </Field>

            <div className="space-y-3 pt-2">
              <label className="flex gap-3 items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedTerms}
                  onChange={(e) => update("agreedTerms", e.target.checked)}
                  className="mt-1 w-4 h-4 accent-teal"
                />
                <span className="font-body text-sm text-body-text">
                  I have read and agree to the{" "}
                  <Link to="/terms" className="text-teal underline">Terms of Use</Link>
                  {" "}and{" "}
                  <Link to="/privacy" className="text-teal underline">Privacy Policy</Link>
                  <span className="text-red-600"> *</span>
                </span>
              </label>
              {errors.agreedTerms && <p className="text-sm text-red-600 ml-7">{errors.agreedTerms}</p>}

              <label className="flex gap-3 items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.marketingOptIn}
                  onChange={(e) => update("marketingOptIn", e.target.checked)}
                  className="mt-1 w-4 h-4 accent-teal"
                />
                <span className="font-body text-sm text-body-text">
                  Send me ProGrafter updates and tips for managing home projects
                </span>
              </label>
            </div>

            {serverError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal text-cream font-mono text-sm px-6 py-3 rounded-xl hover:bg-teal-hover transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-center font-body text-sm text-secondary-text">
              Already have an account?{" "}
              <Link to="/login" className="text-teal underline">Sign in</Link>
            </p>
          </form>

          <p className="mt-6 text-center font-body text-sm text-secondary-text">
            Are you a tradesperson?{" "}
            <Link to="/signup/trade" className="text-teal underline">Join as a Trade</Link>
          </p>
        </div>
      </main>

      <style>{`
        .input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgb(15 23 42 / 0.15);
          border-radius: 10px;
          font-family: inherit;
          font-size: 15px;
          background: white;
          color: rgb(15 23 42);
        }
        .input:focus {
          outline: 2px solid rgb(20 184 166 / 0.6);
          outline-offset: 0;
          border-color: transparent;
        }
      `}</style>
    </div>
  );
};

const Field = ({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block font-mono text-xs uppercase tracking-wider text-body-text mb-1.5">
      {label}
      {required && <span className="text-red-600"> *</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-secondary-text mt-1">{hint}</p>}
    {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
  </div>
);

export default SignupHomeowner;
