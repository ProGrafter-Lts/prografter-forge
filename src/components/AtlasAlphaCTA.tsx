import { Map, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AtlasAlphaCTA() {
  return (
    <section className="bg-deep py-16 px-6 border-y border-white/[0.06]">
      <div className="max-w-[1800px] mx-auto">
        <div
          className="rounded-3xl p-8 md:p-10 border border-white/[0.08] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(27,58,92,0.6) 0%, rgba(13,148,136,0.18) 100%), rgba(255,255,255,0.02)",
          }}
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-[2px] bg-teal" />
                <span className="font-mono text-xs text-teal uppercase tracking-widest">
                  Alpha Test
                </span>
              </div>
              <h2 className="font-heading text-cream text-3xl md:text-4xl leading-tight mb-3">
                Atlas — Guided Site Surveys
              </h2>
              <p className="font-body text-cream/70 text-base md:text-lg max-w-2xl leading-relaxed">
                Field-test the new Atlas workflow: capture property intelligence, log risks and unknowns, and generate a structured survey summary in real time.
              </p>
            </div>

            <Link
              to="/atlas"
              className="group inline-flex items-center justify-center gap-2.5 font-heading text-sm tracking-wide bg-teal text-navy px-7 py-4 rounded-full hover:bg-teal-hover transition-colors shrink-0"
            >
              <Map className="w-4 h-4" />
              Start Atlas Alpha test
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-4 md:gap-8 font-mono text-xs text-cream/55">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Photo & voice capture
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Risk & unknowns register
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Instant summary report
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
