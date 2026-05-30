import SEO from "@/components/SEO";
import AppShell from "@/components/AppShell";
import TermlyEmbed from "@/components/TermlyEmbed";

const Terms = () => {
  return (
    <AppShell>
      <SEO
        title="Terms of Service — ProGrafter"
        description="ProGrafter Ltd terms of use for tradespeople and homeowners."
        path="/terms"
      />
      <main className="px-6 pt-28 pb-16">
        <section className="mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-white p-6 shadow-sm craft:p-10">
          <TermlyEmbed dataId="f633790b-bd54-49c9-86af-a20062c0d0e9" />
        </section>
      </main>
    </AppShell>
  );
};

export default Terms;
