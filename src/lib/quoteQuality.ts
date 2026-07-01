// Trade-side quote quality gate. This is NOT the paid homeowner Quote Health
// Check — it's a lightweight clarity check run before a trade submits, to
// encourage complete, homeowner-friendly quotes.

export interface QuoteQualityInput {
  totalAmount: number | null;
  vatStatus: string | null; // 'inclusive' | 'exclusive' | 'not_registered'
  scopeOfWorks: string | null;
  exclusions: string | null;
  assumptions: string | null;
  paymentSchedule: { amount?: number | null }[] | null;
  estimatedStartDate: string | null;
  estimatedDuration: string | null;
  validUntil: string | null;
  depositRequired: boolean;
  depositAmount: number | null;
  certificationsAnswered: boolean;
}

export interface QuoteIssue {
  message: string;
  critical: boolean;
}

const MIN_SCOPE = 40;

export function checkQuoteQuality(input: QuoteQualityInput): QuoteIssue[] {
  const issues: QuoteIssue[] = [];

  // --- Critical (block submission) ---
  if (!input.totalAmount || input.totalAmount <= 0) {
    issues.push({ message: "A total quote amount is required.", critical: true });
  }
  if (!input.vatStatus) {
    issues.push({ message: "VAT status is unclear — please choose one.", critical: true });
  }
  if (!input.scopeOfWorks || input.scopeOfWorks.trim().length < MIN_SCOPE) {
    issues.push({
      message: "Scope of works is missing or too short — describe what's included.",
      critical: true,
    });
  }
  if (!input.exclusions || input.exclusions.trim().length < 3) {
    issues.push({ message: "No exclusions listed — say what is not included.", critical: true });
  }
  if (!input.assumptions || input.assumptions.trim().length < 3) {
    issues.push({ message: "No assumptions listed — say what you've assumed when pricing.", critical: true });
  }

  // --- Non-critical (can submit anyway) ---
  const stages = input.paymentSchedule || [];
  if (stages.length === 0) {
    issues.push({ message: "No payment schedule added.", critical: false });
  } else if (input.totalAmount) {
    const sum = stages.reduce((s, st) => s + (Number(st.amount) || 0), 0);
    if (Math.abs(sum - input.totalAmount) > 1) {
      issues.push({
        message: `Payment stages (£${sum.toLocaleString()}) do not equal the quote total (£${input.totalAmount.toLocaleString()}).`,
        critical: false,
      });
    }
  }
  if (input.depositRequired && input.depositAmount && input.totalAmount) {
    if (input.depositAmount / input.totalAmount > 0.4) {
      issues.push({
        message: "Deposit is unusually high (over 40% of the total).",
        critical: false,
      });
    }
  }
  if (!input.estimatedStartDate) {
    issues.push({ message: "No estimated start date provided.", critical: false });
  }
  if (!input.estimatedDuration || !input.estimatedDuration.trim()) {
    issues.push({ message: "No estimated duration provided.", critical: false });
  }
  if (!input.validUntil) {
    issues.push({ message: "No quote validity date provided.", critical: false });
  }
  if (!input.certificationsAnswered) {
    issues.push({ message: "Certification / warranty questions are unanswered.", critical: false });
  }

  return issues;
}

export function hasCriticalIssues(issues: QuoteIssue[]): boolean {
  return issues.some((i) => i.critical);
}
