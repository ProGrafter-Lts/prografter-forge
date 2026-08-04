// Customer Discovery & Scoping — guided question configuration.
// Internal ProGrafter admin tool. Not a public homeowner feature.

export type FieldKind = "text" | "textarea" | "select" | "yesno";

export interface GuideField {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  placeholder?: string;
}

export interface GuideSection {
  key: string;
  title: string;
  /** Suggested questions the admin can read out / work through. */
  questions: string[];
  /** Structured fields recorded against the call (stored in answers JSONB). */
  fields: GuideField[];
}

export const CALL_TYPES: { value: string; label: string; sections: string[] }[] = [
  { value: "initial_discovery", label: "Initial homeowner discovery", sections: ["opening", "concern", "scope", "timeline", "documents", "blockers", "feedback", "next_steps"] },
  { value: "job_scoping", label: "Job scoping call", sections: ["opening", "concern", "scope", "documents", "planning", "timeline", "blockers", "next_steps"] },
  { value: "planning_guidance", label: "Planning guidance call", sections: ["opening", "planning", "documents", "scope", "next_steps"] },
  { value: "qhc_followup", label: "AI Quote Checker follow-up", sections: ["opening", "concern", "quotes", "budget", "trade", "feedback", "next_steps"] },
  { value: "quote_clarification", label: "Quote clarification call", sections: ["opening", "quotes", "budget", "scope", "next_steps"] },
  { value: "project_issue", label: "Project issue call", sections: ["opening", "concern", "trade", "timeline", "next_steps"] },
  { value: "trade_matching", label: "Trade matching call", sections: ["opening", "scope", "trade", "timeline", "next_steps"] },
  { value: "post_completion", label: "Post-completion feedback", sections: ["opening", "trade", "feedback", "next_steps"] },
  { value: "customer_research", label: "Test / customer research call", sections: ["opening", "concern", "feedback", "next_steps"] },
];

export const CONFIDENCE_OPTIONS = ["Very low", "Low", "Medium", "High", "Very high"];

export const OPENING_SCRIPT =
  "Thanks for taking the time to speak with me. The purpose of this call is to understand your project, what stage you are at, and what concerns you have before you make any decisions. I'll ask a few questions about the quote, scope, timing and anything you are unsure about. This helps us guide you properly and make sure any trades receive a clearer brief.";

export const OPENING_SCRIPT_RECORDING =
  "Are you happy for me to record and transcribe this call so I can capture the details accurately for your project record?";

export const SECTIONS: Record<string, GuideSection> = {
  opening: {
    key: "opening",
    title: "Opening & context",
    questions: [
      "Introduce yourself and the purpose of the call (see opening script above).",
      "Confirm the project reference and the homeowner's details.",
      "If recording, confirm consent before starting.",
    ],
    fields: [
      { key: "opening_notes", label: "Context / how the call opened", kind: "textarea" },
    ],
  },
  concern: {
    key: "concern",
    title: "Homeowner concerns",
    questions: [
      "What made you contact ProGrafter?",
      "What are you most unsure about right now?",
      "Is your main concern price, trust, scope, timing, quality, payment, or something else?",
      "Have you had a bad experience with trades before?",
      "What would make you feel comfortable proceeding?",
      "What would stop you from accepting the quote?",
      "What are you hoping ProGrafter can help you understand?",
    ],
    fields: [
      { key: "main_concern", label: "Main concern", kind: "text" },
      { key: "secondary_concerns", label: "Secondary concerns", kind: "textarea" },
      { key: "confidence_before", label: "Confidence level before call", kind: "select", options: CONFIDENCE_OPTIONS },
      { key: "confidence_after", label: "Confidence level after call", kind: "select", options: CONFIDENCE_OPTIONS },
    ],
  },
  scope: {
    key: "scope",
    title: "Project scope",
    questions: [
      "Can you describe the project in your own words?",
      "What outcome are you trying to achieve?",
      "What work do you believe is included?",
      "Are there any parts of the job you are unsure about?",
      "Are there drawings, sketches, specifications or photos?",
      "Has anyone visited the property?",
      "Has the builder based the quote on drawings, a site visit, photos, or a phone conversation?",
      "Are there constraints such as access, party wall, drainage, steels, asbestos, services or restricted hours?",
    ],
    fields: [
      { key: "project_type", label: "Project type", kind: "text" },
      { key: "scope_summary", label: "Scope summary", kind: "textarea" },
      { key: "included_works", label: "Known included works", kind: "textarea" },
      { key: "missing_works", label: "Known missing works", kind: "textarea" },
      { key: "known_constraints", label: "Known constraints", kind: "textarea" },
      { key: "documents_available", label: "Documents available", kind: "textarea" },
      { key: "site_visit", label: "Site visit completed", kind: "select", options: ["Yes", "No", "Unknown"] },
    ],
  },
  quotes: {
    key: "quotes",
    title: "Quotes received",
    questions: [
      "How many quotes have you received?",
      "Are the quotes similar or very different?",
      "Which quote are you leaning towards and why?",
      "Does the quote show VAT clearly?",
      "Does it show payment stages?",
      "Does it say what is included / excluded?",
      "Does it give a start date and estimated duration?",
      "Does it mention certificates, warranties or Building Control?",
      "Did the builder explain anything verbally that is not written in the quote?",
      "Are there provisional sums or allowances?",
    ],
    fields: [
      { key: "num_quotes", label: "Number of quotes", kind: "text" },
      { key: "lowest_quote", label: "Lowest quote (£)", kind: "text" },
      { key: "highest_quote", label: "Highest quote (£)", kind: "text" },
      { key: "preferred_quote", label: "Preferred quote", kind: "text" },
      { key: "preference_reason", label: "Reason for preference", kind: "textarea" },
      { key: "vat_clarity", label: "VAT clarity", kind: "select", options: ["Clear", "Unclear", "Not shown"] },
      { key: "payment_clarity", label: "Payment clarity", kind: "select", options: ["Clear", "Unclear", "Not shown"] },
      { key: "scope_clarity", label: "Scope clarity", kind: "select", options: ["Clear", "Unclear", "Not shown"] },
      { key: "exclusions_clarity", label: "Exclusions clarity", kind: "select", options: ["Clear", "Unclear", "Not shown"] },
      { key: "programme_clarity", label: "Programme clarity", kind: "select", options: ["Clear", "Unclear", "Not shown"] },
      { key: "verbal_agreements", label: "Verbal agreements mentioned", kind: "textarea" },
    ],
  },
  budget: {
    key: "budget",
    title: "Budget & payment",
    questions: [
      "What budget did you have in mind before receiving quotes?",
      "Has the quote come in higher or lower than expected?",
      "Are you comfortable with the payment terms?",
      "Has a deposit been requested?",
      "Are payments linked to progress stages?",
      "Are you worried about paying too much upfront?",
      "Would you prefer a staged payment plan?",
    ],
    fields: [
      { key: "budget_expectation", label: "Homeowner budget expectation", kind: "text" },
      { key: "affordability_concern", label: "Quote affordability concern", kind: "textarea" },
      { key: "deposit_concern", label: "Deposit concern", kind: "textarea" },
      { key: "payment_risk", label: "Payment risk notes", kind: "textarea" },
      { key: "payment_clarification", label: "Suggested payment clarification needed", kind: "textarea" },
    ],
  },
  planning: {
    key: "planning",
    title: "Planning & Building Control",
    questions: [
      "Do you know whether planning permission is required?",
      "Has planning already been granted?",
      "Is the work under permitted development?",
      "Do you know whether Building Control approval is required?",
      "Has anyone mentioned structural calculations?",
      "Are there any party wall concerns?",
      "Are any certificates likely to be needed?",
      "Are you unsure and need guidance?",
    ],
    fields: [
      { key: "planning_status", label: "Planning status", kind: "select", options: ["Not required", "Required — not applied", "Applied", "Granted", "Permitted development", "Needs confirming"] },
      { key: "building_control_status", label: "Building Control status", kind: "select", options: ["Not required", "Required", "In progress", "Approved", "Needs confirming"] },
      { key: "structural_calcs", label: "Structural calculations required", kind: "select", options: ["Yes", "No", "Needs confirming"] },
      { key: "party_wall", label: "Party wall possible", kind: "select", options: ["Yes", "No", "Needs confirming"] },
      { key: "certificates_required", label: "Certificates likely required", kind: "textarea" },
      { key: "planning_guidance_given", label: "Planning guidance given", kind: "yesno" },
      { key: "planning_call_notes", label: "Notes (this is guidance, not legal advice)", kind: "textarea" },
    ],
  },
  trade: {
    key: "trade",
    title: "Trade confidence",
    questions: [
      "What made you choose this builder / trade?",
      "Did they come recommended?",
      "Have you checked reviews?",
      "Have you seen previous work?",
      "Have you checked insurance or qualifications?",
      "Did they communicate clearly?",
      "Are there any warning signs that concern you?",
    ],
    fields: [
      { key: "trust_level", label: "Trust level", kind: "select", options: CONFIDENCE_OPTIONS },
      { key: "builder_source", label: "Source of builder", kind: "text" },
      { key: "reviews_checked", label: "Reviews checked", kind: "yesno" },
      { key: "insurance_checked", label: "Insurance checked", kind: "yesno" },
      { key: "qualifications_checked", label: "Qualifications checked", kind: "yesno" },
      { key: "communication_notes", label: "Communication notes", kind: "textarea" },
      { key: "red_flags", label: "Red flags", kind: "textarea" },
    ],
  },
  timeline: {
    key: "timeline",
    title: "Timeline",
    questions: [
      "When do you want the work to start?",
      "Is there a deadline?",
      "Has the builder given a start date?",
      "Has the builder given a completion timeframe?",
      "Are you flexible?",
      "Are there any access or family constraints?",
    ],
    fields: [
      { key: "desired_start", label: "Desired start date", kind: "text" },
      { key: "urgency", label: "Urgency level", kind: "select", options: ["Low", "Medium", "High", "Urgent"] },
      { key: "deadline", label: "Deadline", kind: "text" },
      { key: "flexibility", label: "Flexibility", kind: "textarea" },
      { key: "programme_risk", label: "Programme risk notes", kind: "textarea" },
    ],
  },
  documents: {
    key: "documents",
    title: "Documents",
    questions: [
      "Do you have drawings?",
      "Do you have planning documents?",
      "Do you have Building Control documents?",
      "Do you have structural calculations?",
      "Do you have previous quotes?",
      "Do you have photos or videos of the existing property?",
      "Do you have written messages from the builder?",
    ],
    fields: [
      { key: "drawings_uploaded", label: "Drawings uploaded", kind: "yesno" },
      { key: "quotes_uploaded", label: "Quotes uploaded", kind: "yesno" },
      { key: "photos_uploaded", label: "Photos uploaded", kind: "yesno" },
      { key: "planning_docs_uploaded", label: "Planning docs uploaded", kind: "yesno" },
      { key: "structural_calcs_uploaded", label: "Structural calcs uploaded", kind: "yesno" },
      { key: "missing_documents", label: "Missing documents", kind: "textarea" },
    ],
  },
  blockers: {
    key: "blockers",
    title: "Decision blockers",
    questions: [
      "What is stopping you from making a decision?",
      "What information would you need to feel comfortable?",
      "Would you like a revised quote?",
      "Would you like matched trades to quote?",
      "Would you like ProGrafter to help create a clearer project brief?",
      "Would you like to run a AI Quote Checker?",
    ],
    fields: [
      { key: "decision_blocker", label: "Decision blocker", kind: "textarea" },
      { key: "recommended_next_step", label: "Recommended next step", kind: "textarea" },
      { key: "preferred_next_step", label: "Homeowner preferred next step", kind: "textarea" },
      { key: "follow_up_required", label: "Follow-up required", kind: "yesno" },
    ],
  },
  feedback: {
    key: "feedback",
    title: "ProGrafter feedback",
    questions: [
      "Was the AI Quote Checker useful?",
      "What part was most useful?",
      "What was confusing?",
      "Would you pay for this service?",
      "Would you recommend it?",
      "What would make the dashboard more helpful?",
      "What would make you trust ProGrafter more?",
      "Would you prefer three vetted trades rather than lots of responses?",
      "What would you expect from ProGrafter during a live project?",
    ],
    fields: [
      { key: "product_feedback", label: "Product feedback", kind: "textarea" },
      { key: "quote_checker_feedback", label: "Quote checker feedback", kind: "textarea" },
      { key: "dashboard_feedback", label: "Dashboard feedback", kind: "textarea" },
      { key: "trust_feedback", label: "Trust feedback", kind: "textarea" },
      { key: "willingness_to_pay", label: "Willingness to pay", kind: "text" },
      { key: "testimonial_candidate", label: "Testimonial candidate", kind: "yesno" },
    ],
  },
  next_steps: {
    key: "next_steps",
    title: "Next steps",
    questions: [
      "Summarise agreed next steps with the homeowner.",
      "Confirm who is doing what and by when.",
    ],
    fields: [
      { key: "agreed_next_steps", label: "Agreed next steps", kind: "textarea" },
    ],
  },
};

export const CALL_STATUSES: { value: string; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "notes_drafted", label: "Notes drafted" },
  { value: "needs_follow_up", label: "Needs follow-up" },
  { value: "complete", label: "Complete" },
  { value: "converted", label: "Converted to project update" },
  { value: "in_dataset", label: "Added to intelligence dataset" },
];

export const TASK_TYPES = [
  "Call homeowner back",
  "Send quote questions",
  "Request drawings",
  "Request revised quote",
  "Create project brief",
  "Run AI Quote Checker",
  "Publish to trades",
  "Check planning route",
  "Check Building Control route",
];

export function callTypeLabel(v: string) {
  return CALL_TYPES.find((c) => c.value === v)?.label ?? v;
}
export function callStatusLabel(v: string) {
  return CALL_STATUSES.find((c) => c.value === v)?.label ?? v;
}
