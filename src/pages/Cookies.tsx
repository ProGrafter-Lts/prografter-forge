import AppShell from "@/components/AppShell";
import TermlyEmbed from "@/components/TermlyEmbed";
import SEO from "@/components/SEO";

const Cookies = () => {
  return (
    <AppShell>
      <SEO
        title="Cookie Policy — ProGrafter"
        description="How ProGrafter uses cookies and similar technologies across our UK construction trust platform, and how you can manage your preferences."
        path="/cookies"
      />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <TermlyEmbed dataId="3d54bbe8-f475-4c1c-b597-4e11d22b472a" />
        </div>
      </div>
    </AppShell>
  );
};

export default Cookies;
