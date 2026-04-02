import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  useEffect(() => {
    const id = "termly-jssdk";
    if (document.getElementById(id)) return;
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://app.termly.io/embed-policy.min.js";
    document.head.appendChild(js);
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div
          data-id="eda35981-ef8d-432e-81a4-1644d9d2bf29"
          // @ts-ignore
          name="termly-embed"
        />
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
