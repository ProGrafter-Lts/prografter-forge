import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import TermlyEmbed from "@/components/TermlyEmbed";

const Privacy = () => {
  return (
    <AppShell>
      <SEO
        title="Privacy Policy — ProGrafter"
        description="How ProGrafter Ltd collects, stores and uses your data."
        path="/privacy"
      />
      <main className="px-6 pt-28 pb-16">
        <section className="mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-white p-6 shadow-sm craft:p-10">
          <TermlyEmbed dataId="eda35981-ef8d-432e-81a4-1644d9d2bf29" />
        </section>
      </main>
    </AppShell>
  );
};

export default Privacy;

