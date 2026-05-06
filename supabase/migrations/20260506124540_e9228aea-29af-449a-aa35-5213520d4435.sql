
-- Refresh placeholder contract template content.
-- Post-delivery migration path (when solicitor delivers final text):
--   1. INSERT a new contract_templates row with version='v1.0', status='active', signing_enabled=true.
--   2. UPDATE this placeholder row: status='superseded', superseded_at=NOW().
--   3. Flip CONTRACT_TEMPLATE_APPROVED env flag to true.
--   4. Hide the dashboard banner UI.
--   5. Do NOT retroactively re-render historical contracts; they stay on placeholder version.

UPDATE public.contract_templates
SET
  drafted_by = 'ProGrafter — placeholder pending solicitor delivery',
  signing_enabled = false,
  effective_from = COALESCE(effective_from, NOW()),
  superseded_at = NULL,
  plain_english_summary = 'This contract sets out the agreement between you (the Homeowner) and the Trade for the work described in your project. It covers seven areas: who is involved, what work will be done, how and when payment happens, what to do if the work needs to change, when the work is considered finished, what happens if defects are found afterwards, and the standard legal terms that protect both parties. ProGrafter is currently finalising the legal wording with a construction solicitor. Until that is complete, contracts can be generated and reviewed but not signed — see the banner on the contract page for the current status.',
  guidance_notes = jsonb_build_object(
    'section_1_parties', 'Identifies the homeowner and trade by name, address, and contact. Auto-populated from your ProGrafter profiles at the moment the contract is generated.',
    'section_2_scope', 'Auto-populated from the accepted quote. Includes the schedule of works, materials specifications, and methodology.',
    'section_3_payments', 'Stage payments aligned with project milestones, processed via Stripe Connect. Funds are captured at contract signing and released at each milestone sign-off.',
    'section_4_variations', 'Any work outside the original scope must be proposed and digitally signed by both parties before commencement. ProGrafter logs every variation to the audit trail.',
    'section_5_completion', 'Defines what "completed" means for this project. Final payment is released only when the homeowner digitally accepts completion.',
    'section_6_defects', 'Standard 12-month defects liability period. Trade returns to fix any defects identified within this window at no charge.',
    'section_7_terms', 'Standard legal terms — to be drafted by ProGrafter''s construction solicitor. Currently placeholder.'
  ),
  legal_text = $LEGAL$## 1. Parties and Project Reference

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This contract is between {{homeowner_name}} of {{homeowner_address}} (the "Homeowner") and {{trade_business_name}} (the "Trade") in respect of the project at {{property_address}} ("the Project"). Reference number: {{contract_id}}. Date: {{contract_date}}. Template version: {{template_version}}.

## 2. Scope of Works

Lorem ipsum dolor sit amet, consectetur adipiscing elit. The Trade agrees to carry out the works described as: {{scope_summary}}. Estimated start date: {{start_date}}. Estimated completion: {{completion_date}}. Total contract value: {{contract_value}} ({{contract_value_words}}).

## 3. Staged Payments and Milestones

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Payments will be made in stages as set out in the following schedule:

{{payment_milestones_table}}

All payments are processed via Stripe Connect and held in escrow until the corresponding milestone is digitally signed off by the Homeowner.

## 4. Variations and Sign-Off

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Any work that falls outside the Scope of Works in section 2 must be agreed as a Variation before any such work commences. The procedure is:

- The Trade proposes the Variation through the ProGrafter platform
- The proposal includes a description, cost change, and time impact
- The Homeowner approves or rejects digitally
- Approved Variations form part of this contract by addendum
- No work outside this scope will be paid for if not signed off in advance

## 5. Completion Criteria and Handover

Lorem ipsum dolor sit amet, consectetur adipiscing elit. The Project will be considered complete when:

- All works in the Scope (and approved Variations) are finished
- All applicable certificates are issued and uploaded to ProGrafter
- The Homeowner Manual has been generated and delivered
- The Homeowner digitally accepts completion via the platform

Final payment is released to the Trade upon Homeowner acceptance.

## 6. Defects Period

Lorem ipsum dolor sit amet, consectetur adipiscing elit. A defects liability period of 12 months applies from the date of completion. During this period, the Trade will return to remedy any defects in workmanship at no additional cost to the Homeowner. This does not cover normal wear and tear or damage caused by the Homeowner.

## 7. Standard Terms

Lorem ipsum dolor sit amet, consectetur adipiscing elit. PLACEHOLDER — to be drafted by ProGrafter''s construction solicitor. The final version will cover: governing law (England and Wales), dispute resolution, termination rights, force majeure, intellectual property, data protection compliance with UK GDPR, limitation of liability, and standard interpretation provisions.

This contract is governed by the laws of England and Wales.

Signed by the Homeowner: {{homeowner_name}} on {{contract_date}}

Signed by the Trade: {{trade_business_name}} on {{contract_date}}
$LEGAL$,
  updated_at = NOW()
WHERE version = 'placeholder-pre-launch';
