import { useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";

import AppShell from "@/components/AppShell";

import SEO from "@/components/SEO";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";

import { trackEvent } from "@/lib/analytics";

import {

  PLAN_CATEGORIES,

  PLAN_EXCLUSIONS,

  formatBand,

  getPlanCategory,

  type PlanAnswers,

  type PlanEstimate,

} from "@/lib/planMyProject";

import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Loader2, ShieldAlert } from "lucide-react";



// Live matching area — East Midlands outcodes (same list used for trade geography)

const LIVE_AREA_PREFIXES = ["NG", "DE", "LE", "LN", "S", "DN"] as const;

const normalisePostcode = (pc: string) => pc.trim().toUpperCase().replace(/\s+/g, "");

const outcodeOf = (pc: string) => {

  const p = normalisePostcode(pc);

  const m = p.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);

  return m ? m[1] : "";

};

const isInLiveArea = (pc: string) => {

  const out = outcodeOf(pc);

  if (!out) return false;

  const letters = out.match(/^[A-Z]+/)?.[0] || "";

  return (LIVE_AREA_PREFIXES as readonly string[]).includes(letters);

};



const STAGES = ["Plan", "Project", "Costs", "Quotations", "Builder", "Build"];



const StageBar = () => (

  <div className="flex flex-wrap items-center justify-center gap-2">

    {STAGES.map((s, i) => (

      <span

        key={s}

        className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full border ${

          i === 0

            ? "bg-teal text-cream border-teal"

            : "bg-transparent text-muted-foreground border-border"

        }`}

      >

        {s}

      </span>

    ))}

  </div>

);



const Card = ({ children }: { children: React.ReactNode }) => (

  <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm space-y-5">{children}</div>

);



const PlanMyProject = () => {

  const navigate = useNavigate();

  const { toast } = useToast();



  const [step, setStep] = useState(0);

  const [categoryId, setCategoryId] = useState("");

  const [answers, setAnswers] = useState<PlanAnswers>({});

  const [acknowledged, setAcknowledged] = useState(false);

  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [tradePostcode, setTradePostcode] = useState("");

  const [waitlistEmail, setWaitlistEmail] = useState("");

  const [waitlistSaving, setWaitlistSaving] = useState(false);

  const [waitlistDone, setWaitlistDone] = useState(false);

  const [waitlistError, setWaitlistError] = useState<string | null>(null);



  const category = useMemo(() => (categoryId ? getPlanCategory(categoryId) : null), [categoryId]);

  const tradeOutcode = useMemo(() => outcodeOf(tradePostcode), [tradePostcode]);

  const tradeInLiveArea = useMemo(() => isInLiveArea(tradePostcode), [tradePostcode]);



  const estimate: PlanEstimate | null = useMemo(

    () => (category && step >= 4 ? category.estimate(answers) : null),

    [category, answers, step],

  );



  const setAnswer = (id: string, value: PlanAnswers[string]) =>

    setAnswers((prev) => ({ ...prev, [id]: value }));



  const toggleFlag = (id: string, value: string) =>

    setAnswers((prev) => {

      const current = Array.isArray(prev[id]) ? (prev[id] as string[]) : [];

      return {

        ...prev,

        [id]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],

      };

    });



  const questionsComplete =

    !!category &&

    category.questions.every((q) => {

      if (q.optional || q.type === "flags") return true;

      const v = answers[q.id];

      return v !== undefined && v !== "";

    });



  const handleSave = async () => {

    if (!category || !estimate) return;

    if (!email || !email.includes("@")) {

      toast({ title: "Enter your email", description: "We'll save this estimate to your dashboard.", variant: "destructive" });

      return;

    }

    setSaving(true);

    try {

      const { data: session } = await supabase.auth.getUser();

      const { error } = await supabase.from("plan_my_project_submissions").insert({

        user_id: session.user?.id ?? null,

        category: category.id,

        category_label: category.label,

        answers: answers as never,

        cost_band_low: estimate.low,

        cost_band_high: estimate.high,

        cost_band_label: formatBand(estimate.low, estimate.high),

        drivers: estimate.drivers as never,

        considerations: estimate.considerations as never,

        exclusions_acknowledged: acknowledged,

        email: email.trim().toLowerCase(),

      });

      if (error) throw error;

      setSaved(true);

      toast({ title: "Estimate saved", description: "It's stored against your email and dashboard." });

    } catch (err) {

      console.error(err);

      toast({ title: "Couldn't save", description: "Please try again in a moment.", variant: "destructive" });

    } finally {

      setSaving(false);

    }

  };



  const joinWaitlist = async () => {

    const emailTrim = waitlistEmail.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim) || emailTrim.length > 255) {

      setWaitlistError("Please enter a valid email address");

      return;

    }

    setWaitlistSaving(true);

    setWaitlistError(null);

    const pc = normalisePostcode(tradePostcode).slice(0, 12);

    const { error } = await supabase.from("cost_guide_area_waitlist").insert({

      email: emailTrim,

      postcode: pc,

      outcode: outcodeOf(tradePostcode) || null,

      project_type: category?.id ?? null,

    });



    setWaitlistSaving(false);

    if (error) {

      setWaitlistError("Couldn't save that just now — please try again.");

      return;

    }

    setWaitlistDone(true);

    trackEvent("cost_guide_out_of_area_waitlist", { project_type: category?.id });

  };



  const back = () => setStep((s) => Math.max(0, s - 1));



  return (

    <AppShell>

      <SEO

        title="Project Cost Guide | Free UK Build Cost Estimate | ProGrafter"

        description="Answer a few questions about your project and get a free, rule-based cost band plus the things to consider before you ask builders to quote."

        path="/project-cost-guide"

      />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 md:pt-28 space-y-6">

        <StageBar />



        {/* STEP 0 — Landing */}

        {step === 0 && (

          <div className="space-y-6 text-center">

            <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1">

              <ClipboardList className="h-4 w-4 text-teal" />

              <span className="font-mono text-[11px] uppercase tracking-wider text-teal">Free — no quote needed</span>

            </div>

            <h1 className="font-heading text-3xl md:text-4xl text-navy">Project Cost Guide</h1>

            <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">

              You don't have a quote yet — that's the point. Answer a few straightforward questions and we'll

              show you a realistic cost band, what's driving it, and the things worth sorting out before a builder

              prices the work.

            </p>

            <Card>

              <ul className="text-left space-y-3">

                {[

                  "Rule-based cost bands, not guesswork from an AI",

                  "Plain-English list of what's driving your number",

                  "The exclusions spelled out before you see a figure",

                  "Saved to your dashboard so it's there when quotes arrive",

                ].map((t) => (

                  <li key={t} className="flex items-start gap-2">

                    <CheckCircle2 className="h-4 w-4 text-teal mt-0.5 shrink-0" />

                    <span className="font-mono text-sm text-navy">{t}</span>

                  </li>

                ))}

              </ul>

              <Button

                onClick={() => setStep(1)}

                className="w-full h-12 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover"

              >

                Start planning <ArrowRight className="ml-2 h-4 w-4" />

              </Button>

            </Card>

          </div>

        )}



        {/* STEP 1 — Category */}

        {step === 1 && (

          <Card>

            <div>

              <span className="font-mono text-[10px] uppercase tracking-wider text-teal">Step 1 of 4</span>

              <h2 className="font-heading text-xl text-navy">What sort of work are you planning?</h2>

            </div>

            <div className="grid sm:grid-cols-2 gap-3">

              {PLAN_CATEGORIES.map((c) => {

                const disabled = c.status === "coming_soon";

                return (

                  <button

                    key={c.id}

                    type="button"

                    disabled={disabled}

                    onClick={() => {

                      setCategoryId(c.id);

                      setAnswers({});

                      setStep(2);

                    }}

                    className={`text-left rounded-xl border p-4 transition-colors ${

                      disabled

                        ? "border-border bg-muted/40 opacity-60 cursor-not-allowed"

                        : "border-border bg-card hover:border-teal hover:shadow-md"

                    }`}

                  >

                    <p className="font-heading text-base text-navy">{c.label}</p>

                    <p className="font-mono text-xs text-muted-foreground mt-1">{c.blurb}</p>

                    {disabled && (

                      <span className="inline-block mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">

                        Coming soon

                      </span>

                    )}

                  </button>

                );

              })}

            </div>

            <button onClick={back} className="font-mono text-xs text-muted-foreground hover:text-navy inline-flex items-center gap-1">

              <ArrowLeft className="h-3 w-3" /> Back

            </button>

          </Card>

        )}



        {/* STEP 2 — Questions */}

        {step === 2 && category && (

          <Card>

            <div>

              <span className="font-mono text-[10px] uppercase tracking-wider text-teal">Step 2 of 4</span>

              <h2 className="font-heading text-xl text-navy">{category.label}</h2>

              <p className="font-mono text-xs text-muted-foreground mt-1">

                Rough answers are fine — anything you don't know yet, leave blank.

              </p>

            </div>



            <div className="space-y-5">

              {category.questions.map((q) => (

                <div key={q.id} className="space-y-2">

                  <Label className="font-mono text-sm text-navy leading-snug">

                    {q.label}

                    {q.optional && <span className="text-muted-foreground"> (optional)</span>}

                  </Label>

                  {q.help && <p className="font-mono text-xs text-muted-foreground">{q.help}</p>}



                  {q.type === "select" && (

                    <Select

                      value={(answers[q.id] as string) ?? ""}

                      onValueChange={(v) => setAnswer(q.id, v)}

                    >

                      <SelectTrigger className="font-mono">

                        <SelectValue placeholder="Select an answer" />

                      </SelectTrigger>

                      <SelectContent>

                        {q.options?.map((o) => (

                          <SelectItem key={o.value} value={o.value} className="font-mono">

                            {o.label}

                          </SelectItem>

                        ))}

                      </SelectContent>

                    </Select>

                  )}



                  {q.type === "number" && (

                    <Input

                      type="number"

                      min={0}

                      inputMode="numeric"

                      placeholder={q.unit ? `e.g. 25 ${q.unit}` : "e.g. 25"}

                      value={(answers[q.id] as number | string) ?? ""}

                      onChange={(e) => setAnswer(q.id, e.target.value)}

                      className="font-mono"

                    />

                  )}



                  {q.type === "flags" && (

                    <div className="grid sm:grid-cols-2 gap-2">

                      {q.flags?.map((f) => {

                        const active = ((answers[q.id] as string[]) ?? []).includes(f.value);

                        return (

                          <button

                            key={f.value}

                            type="button"

                            onClick={() => toggleFlag(q.id, f.value)}

                            className={`text-left rounded-xl border px-3 py-2.5 font-mono text-xs transition-colors ${

                              active

                                ? "border-teal bg-teal/10 text-navy"

                                : "border-border bg-card text-muted-foreground hover:border-teal/50"

                            }`}

                          >

                            {f.label}

                          </button>

                        );

                      })}

                    </div>

                  )}

                </div>

              ))}

            </div>



            <div className="flex items-center justify-between gap-3 pt-2">

              <button onClick={back} className="font-mono text-xs text-muted-foreground hover:text-navy inline-flex items-center gap-1">

                <ArrowLeft className="h-3 w-3" /> Back

              </button>

              <Button

                onClick={() => setStep(3)}

                disabled={!questionsComplete}

                className="h-11 px-6 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover disabled:bg-muted disabled:text-muted-foreground/70 disabled:opacity-100"

              >

                Continue <ArrowRight className="ml-2 h-4 w-4" />

              </Button>

            </div>

          </Card>

        )}



        {/* STEP 3 — Mandatory exclusions */}

        {step === 3 && category && (

          <Card>

            <div className="flex items-start gap-3">

              <ShieldAlert className="h-6 w-6 text-navy shrink-0" />

              <div>

                <span className="font-mono text-[10px] uppercase tracking-wider text-teal">Step 3 of 4</span>

                <h2 className="font-heading text-xl text-navy">Before your estimate — what this does NOT cover</h2>

                <p className="font-mono text-xs text-muted-foreground mt-1">

                  We show this before the number, not after it. Read it properly — this is where budgets usually go wrong.

                </p>

              </div>

            </div>



            <ul className="space-y-3">

              {PLAN_EXCLUSIONS.map((e) => (

                <li key={e.title} className="rounded-xl border border-border bg-muted/30 p-4">

                  <p className="font-heading text-sm text-navy">{e.title}</p>

                  <p className="font-mono text-xs text-muted-foreground mt-1">{e.detail}</p>

                </li>

              ))}

            </ul>



            <label className="flex items-start gap-3 rounded-xl border border-border p-4 cursor-pointer">

              <Checkbox

                checked={acknowledged}

                onCheckedChange={(v) => setAcknowledged(v === true)}

                className="mt-0.5"

              />

              <span className="font-mono text-sm text-navy leading-snug">

                I understand this is a starting-point estimate only, and that the items above are not included.

              </span>

            </label>



            <div className="flex items-center justify-between gap-3">

              <button onClick={back} className="font-mono text-xs text-muted-foreground hover:text-navy inline-flex items-center gap-1">

                <ArrowLeft className="h-3 w-3" /> Back

              </button>

              <Button

                onClick={() => setStep(4)}

                disabled={!acknowledged}

                className="h-11 px-6 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover disabled:bg-muted disabled:text-muted-foreground/70 disabled:opacity-100"

              >

                Show my estimate <ArrowRight className="ml-2 h-4 w-4" />

              </Button>

            </div>

          </Card>

        )}



        {/* STEP 4 — Result */}

        {step === 4 && category && estimate && (

          <div className="space-y-5">

            <Card>

              <div className="text-center space-y-2">

                <span className="font-mono text-[10px] uppercase tracking-wider text-teal">

                  Indicative cost band — {category.label}

                </span>

                <p className="font-heading text-3xl md:text-4xl text-navy">

                  {formatBand(estimate.low, estimate.high)}

                </p>

                <p className="font-mono text-xs text-muted-foreground">

                  {estimate.indicativeOnly

                    ? "Based on a typical size for this type of work — add your measurements for a tighter band."

                    : "A starting-point range, not a quote. Real quotes will vary with site conditions."}

                </p>

              </div>

            </Card>



            <Card>

              <h3 className="font-heading text-lg text-navy">What's driving this estimate</h3>

              <ul className="space-y-2">

                {estimate.drivers.map((d, i) => (

                  <li key={i} className="flex items-start gap-2">

                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal shrink-0" />

                    <span className="font-mono text-sm text-navy">{d}</span>

                  </li>

                ))}

              </ul>

            </Card>



            <Card>

              <h3 className="font-heading text-lg text-navy">Things to consider</h3>

              <ul className="space-y-3">

                {estimate.considerations.map((c, i) => (

                  <li key={i} className="rounded-xl border border-border bg-muted/30 p-4 font-mono text-sm text-navy leading-relaxed">

                    {c}

                  </li>

                ))}

              </ul>

            </Card>



            <Card>

              <h3 className="font-heading text-lg text-navy">Save this estimate</h3>

              <p className="font-mono text-xs text-muted-foreground">

                We'll keep it on your dashboard so you can compare it against real quotes later.

              </p>

              <div className="space-y-2">

                <Label className="font-mono text-sm text-navy">Email address</Label>

                <Input

                  type="email"

                  placeholder="you@example.com"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  className="font-mono"

                  disabled={saved}

                />

              </div>

              <Button

                onClick={handleSave}

                disabled={saving || saved}

                className="w-full h-11 bg-navy text-cream font-mono text-sm rounded-xl hover:bg-navy/90 disabled:opacity-70"

              >

                {saving ? (

                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span>

                ) : saved ? (

                  "Saved to your dashboard"

                ) : (

                  "Save my estimate"

                )}

              </Button>

            </Card>



            <Card>

              <h3 className="font-heading text-lg text-navy">Ready to find a vetted trade?</h3>

              <p className="font-mono text-xs text-muted-foreground">

                Enter your postcode and we'll show you the fastest way to get matched to a verified local trade.

              </p>

              <div className="space-y-2">

                <Label className="font-mono text-sm text-navy">Postcode</Label>

                <Input

                  type="text"

                  placeholder="e.g. NG1 1AA"

                  value={tradePostcode}

                  onChange={(e) => setTradePostcode(e.target.value)}

                  className="font-mono"

                />

              </div>



              {tradeOutcode && (

                tradeInLiveArea ? (

                  <Button

                    asChild

                    className="w-full h-11 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover"

                  >

                    <Link to="/post-job-brief">

                      Post this job and get matched to verified local trades <ArrowRight className="ml-2 h-4 w-4" />

                    </Link>

                  </Button>

                ) : waitlistDone ? (

                  <div className="rounded-xl border border-teal bg-teal/10 p-4">

                    <p className="font-heading text-sm text-teal">You're on the list</p>

                    <p className="font-mono text-xs text-navy mt-1">

                      We've saved <strong>{waitlistEmail.trim()}</strong> and we'll email you as soon as ProGrafter

                      starts matching verified trades in your area. No spam, one email only.

                    </p>

                  </div>

                ) : (

                  <div className="space-y-2">

                    <p className="font-mono text-xs text-muted-foreground">

                      We're not matching trades in your area yet. Leave your email and we'll let you know when

                      ProGrafter expands there.

                    </p>

                    <div className="flex gap-2 flex-wrap">

                      <Input

                        type="email"

                        placeholder="you@example.com"

                        value={waitlistEmail}

                        onChange={(e) => setWaitlistEmail(e.target.value)}

                        maxLength={255}

                        className="font-mono flex-1 min-w-[180px]"

                      />

                      <Button

                        onClick={joinWaitlist}

                        disabled={waitlistSaving}

                        className="h-10 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover"

                      >

                        {waitlistSaving ? "Saving…" : "Notify me"}

                      </Button>

                    </div>

                    {waitlistError && (

                      <p className="font-mono text-xs text-red-600">{waitlistError}</p>

                    )}

                  </div>

                )

              )}

            </Card>



            {/* STEP 5 — Upsell bridge */}

            <Card>

              <h3 className="font-heading text-lg text-navy">Already got a quote for this work?</h3>

              <p className="font-mono text-sm text-muted-foreground">

                Project Cost Guide gives you a band before a quote exists. Once a builder has priced it, our AI Quote

                Checker reviews that actual document line by line against our standard for this trade.

              </p>

              <Button

                onClick={() =>

                  navigate(

                    category.checkerModuleId

                      ? `/quote-checker?module=${category.checkerModuleId}`

                      : "/quote-checker",

                  )

                }

                className="w-full h-11 bg-teal text-cream font-mono text-sm rounded-xl hover:bg-teal-hover"

              >

                Check my quote against the standard <ArrowRight className="ml-2 h-4 w-4" />

              </Button>

              <div className="flex items-center justify-between gap-3">

                <button

                  onClick={() => setStep(2)}

                  className="font-mono text-xs text-muted-foreground hover:text-navy inline-flex items-center gap-1"

                >

                  <ArrowLeft className="h-3 w-3" /> Change my answers

                </button>

                <Link to="/project-clarity" className="font-mono text-xs text-teal hover:underline">

                  Not sure where you are? Try Project Clarity

                </Link>

              </div>

            </Card>



            <p className="text-center font-mono text-[11px] text-muted-foreground leading-relaxed">

              Guidance only. This is an indicative range based on typical UK costs and does not replace a site visit

              or a priced quotation from a qualified contractor.

            </p>

          </div>

        )}

      </div>

    </AppShell>

  );

};



export default PlanMyProject;