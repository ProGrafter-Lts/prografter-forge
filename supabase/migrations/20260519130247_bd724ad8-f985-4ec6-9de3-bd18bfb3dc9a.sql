-- Deactivate the Commercial Fit-Out specialism (ProGrafter is a domestic platform)
UPDATE public.specialisms SET is_active = false WHERE slug = 'commercial-fit-out';

-- Remove pre-production QuickBuild test drafts (LS6 electrical + GU22 extension)
DELETE FROM public.quickbuild_generations
WHERE id IN (
  '4b88b2ac-6b78-4f21-834c-36d2690d16fb',
  'a53871b0-e82c-4c3b-a728-dec200b87893',
  'd358c0f8-f538-4d14-a20d-79c09d5ca57a'
);