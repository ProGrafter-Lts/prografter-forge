import LegalLayout, { Section } from "@/components/legal/LegalLayout";
import { openCookiePreferences } from "@/components/CookieConsent";

const ROWS: { cat: string; purpose: string; consent: string }[] = [
  { cat: "Strictly necessary", purpose: "Login sessions, security, load balancing", consent: "No — always on" },
  { cat: "Functional", purpose: "Remembering preferences (e.g. saved filters)", consent: "Yes" },
  { cat: "Analytics", purpose: "Understanding usage to improve the platform (e.g. Google Analytics)", consent: "Yes" },
  { cat: "Marketing", purpose: "Not currently used", consent: "Yes (reserved for future use)" },
];

const Cookies = () => (
  <LegalLayout
    title="Cookie Policy"
    seoTitle="Cookie Policy — ProGrafter"
    description="The cookies ProGrafter uses, why we use them, and how to manage your consent preferences."
    path="/cookies"
    intro={
      <p>
        We use cookies to make ProGrafter work and, with your consent, to understand how it's used.
      </p>
    }
  >
    <Section heading="Categories">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy/10">
              <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wide text-secondary-text">Category</th>
              <th className="py-2 pr-4 font-mono text-xs uppercase tracking-wide text-secondary-text">Purpose</th>
              <th className="py-2 font-mono text-xs uppercase tracking-wide text-secondary-text">Consent required</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.cat} className="border-b border-navy/5 align-top">
                <td className="py-3 pr-4 font-medium text-navy">{r.cat}</td>
                <td className="py-3 pr-4">{r.purpose}</td>
                <td className="py-3">{r.consent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        You can manage your preferences at any time via the{" "}
        <button type="button" onClick={openCookiePreferences} className="text-teal underline hover:no-underline">
          Consent Preferences
        </button>{" "}
        link in the site footer. Choices are recorded so you're not asked again unless you clear
        your browser data or change your decision.
      </p>
    </Section>

    <Section heading="Cookies in use">
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          <code>session</code> — strictly necessary, platform login
        </li>
        <li>
          <code>_ga_#</code> — analytics (Google Analytics), if accepted
        </li>
        <li>
          <code>__cf_bm</code> — strictly necessary, bot protection (Cloudflare, via our backend
          provider)
        </li>
      </ul>
      <p>This list is reviewed and updated as the platform changes.</p>
    </Section>
  </LegalLayout>
);

export default Cookies;
