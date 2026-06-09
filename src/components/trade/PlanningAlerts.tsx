import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  MapPin,
  FileText,
  Check,
  ChevronRight,
  Loader2,
  Copy,
  Building2,
} from "lucide-react";
import { Leaf } from "lucide-react";

interface TradeProfile {
  id: string;
  name: string;
  company_name: string;
  trade_type: string;
  phone: string;
  is_green_trade: boolean;
  inca_certified: boolean;
}

interface PlanningAlert {
  id: string;
  reference: string;
  address: string;
  description: string;
  status: string;
  received_at: string;
}

const TIERS = [
  {
    id: "local",
    name: "Local Builder",
    price: "£49",
    period: "/mo",
    description:
      "Extensions, loft conversions, and residential planning applications in your area.",
    keywords: ["extension", "loft conversion", "residential"],
    color: "border-navy/20",
    accent: "bg-navy/5",
  },
  {
    id: "ewi",
    name: "EWI & Insulation Specialist",
    price: "£79",
    period: "/mo",
    description:
      "Instant notification of every External Wall Insulation, solid wall insulation, and external rendering planning application within your chosen radius. Includes one-click branded letter generation sent directly to the applicant.",
    keywords: [
      "external wall insulation",
      "EWI",
      "external render",
      "solid wall insulation",
      "external cladding",
    ],
    color: "border-green-500/30",
    accent: "bg-green-500/5",
    badge: true,
  },
  {
    id: "commercial",
    name: "Commercial & Multi-Unit",
    price: "£99",
    period: "/mo",
    description:
      "Commercial, industrial, and multi-unit residential planning applications.",
    keywords: ["commercial", "industrial", "multi-unit"],
    color: "border-navy/20",
    accent: "bg-navy/5",
  },
  {
    id: "developer",
    name: "Developer & New-Build",
    price: "£199",
    period: "/mo",
    description:
      "All new-build, demolition, and major development applications. Priority notifications.",
    keywords: ["new-build", "demolition", "major development"],
    color: "border-navy/20",
    accent: "bg-navy/5",
  },
];

function generateOutreachLetter(trade: TradeProfile, address: string): string {
  return `Dear Homeowner,

Congratulations on your recent planning approval for works at ${address}.

My name is ${trade.name} and I am an INCA-certified External Wall Insulation installer operating in your area.

I noticed your application and wanted to make contact ahead of your project starting.

As an installer registered with ProGrafter — the UK's verified trades marketplace — all my work is fully documented with daily site updates, digital sign-off on any changes, and a complete Homeowner Manual at completion.

I would be delighted to provide a free, no-obligation quote for your insulation works.

Kind regards,
${trade.name}
${trade.phone}
prografter.co.uk`;
}

export const PlanningAlertsSection = ({
  trade,
}: {
  trade: TradeProfile;
}) => {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [generatingLetter, setGeneratingLetter] = useState<string | null>(null);
  const [letterGenerated, setLetterGenerated] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Demo alerts for EWI tier preview
  const demoAlerts: PlanningAlert[] = [
    {
      id: "demo-1",
      reference: "APP/2026/0412",
      address: "14 Rosemary Lane, Bristol BS3 4QT",
      description: "Installation of external wall insulation system to front and rear elevations",
      status: "Approved",
      received_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "demo-2",
      reference: "APP/2026/0398",
      address: "22 Oakfield Road, Bath BA1 3PP",
      description: "External render and cladding to three-storey terrace property",
      status: "Approved",
      received_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const handleGenerateLetter = async (alert: PlanningAlert) => {
    if (!trade) return;
    setGeneratingLetter(alert.id);

    const letter = generateOutreachLetter(trade, alert.address);

    // Store letter in database
    await supabase.from("letters_sent").insert({
      trade_id: trade.id,
      application_reference: alert.reference,
      address: alert.address,
      letter_content: letter,
    });

    setLetterGenerated((prev) => ({ ...prev, [alert.id]: letter }));
    setGeneratingLetter(null);
  };

  const handleCopyLetter = (alertId: string) => {
    const letter = letterGenerated[alertId];
    if (letter) {
      navigator.clipboard.writeText(letter);
      setCopiedId(alertId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-navy text-2xl mb-1">Planning Intelligence</h2>
        <p className="font-mono text-xs text-secondary-text">
          Get notified instantly when relevant planning applications are approved in your area.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => setSelectedTier(tier.id === selectedTier ? null : tier.id)}
            className={`text-left rounded-2xl p-5 border-2 transition-all ${tier.accent} ${
              selectedTier === tier.id
                ? tier.id === "ewi"
                  ? "border-green-500 shadow-md"
                  : "border-teal shadow-md"
                : tier.color
            } hover:shadow-sm`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {tier.badge && <Leaf className="w-4 h-4 text-green-500" />}
                <span className="font-heading text-navy text-lg">{tier.name}</span>
              </div>
              <div className="text-right">
                <span className="font-heading text-2xl text-navy">{tier.price}</span>
                <span className="font-mono text-xs text-secondary-text">{tier.period}</span>
              </div>
            </div>
            <p className="font-mono text-xs text-secondary-text leading-relaxed">
              {tier.description}
            </p>
            {selectedTier === tier.id && (
              <div className="mt-3 pt-3 border-t border-navy/10">
                <span
                  className={`inline-flex items-center gap-1 font-mono text-xs px-3 py-1.5 rounded-full ${
                    tier.id === "ewi"
                      ? "bg-green-500 text-white"
                      : "bg-teal text-cream"
                  }`}
                >
                  Subscribe Now
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* EWI Alerts preview */}
      {selectedTier === "ewi" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-500" />
            <h3 className="font-heading text-navy text-xl">EWI Alert Preview</h3>
            <span className="bg-green-500/10 text-green-600 font-mono text-[10px] px-2 py-0.5 rounded-full">
              DEMO
            </span>
          </div>

          {demoAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-card rounded-2xl p-5 border border-green-500/20 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <span className="font-mono text-xs text-green-600 font-semibold">
                      {alert.reference}
                    </span>
                    <span className="bg-green-500/10 text-green-600 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      {alert.status}
                    </span>
                  </div>
                  <h4 className="font-heading text-navy">{alert.address}</h4>
                  <p className="font-mono text-xs text-secondary-text mt-1">
                    {alert.description}
                  </p>
                </div>
              </div>

              {letterGenerated[alert.id] ? (
                <div className="mt-3 space-y-3">
                  <div className="bg-cream rounded-xl p-4 border border-navy/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-secondary-text">
                        Generated Letter
                      </span>
                      <button
                        onClick={() => handleCopyLetter(alert.id)}
                        className="flex items-center gap-1 font-mono text-[10px] text-teal hover:text-teal-hover transition-colors"
                      >
                        {copiedId === alert.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="font-mono text-xs text-navy whitespace-pre-wrap leading-relaxed">
                      {letterGenerated[alert.id]}
                    </pre>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleGenerateLetter(alert)}
                  disabled={generatingLetter === alert.id}
                  className="mt-3 flex items-center gap-2 bg-green-500 text-white font-mono text-xs px-4 py-2 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {generatingLetter === alert.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  Generate Outreach Letter
                </button>
              )}
            </div>
          ))}

          <p className="font-mono text-[10px] text-secondary-text text-center">
            These are example alerts. Subscribe to receive live planning notifications in your area.
          </p>
        </div>
      )}
    </div>
  );
};
