# One project screen — panels instead of pages

## 1. How big is this job?

**Not a rebuild. Medium-sized refactor, mostly moving existing pieces.**

Why it's cheaper than it looks:

- The project screen already keeps its section state in the page itself (a `tab` value in the address bar), so switching sections never leaves the screen. Overview, Stages, Payments, Activity, Documents, Photos and Messages are already panels — only the contract escaped into its own page.
- A slide-over drawer mechanism already exists and is already used for opening a project over a dashboard list. Reusing it for contract-level detail is wiring, not new machinery.
- Every section is already a self-contained component (contract, variations, commission, photos, documents, activity, stages, payments). Nothing needs rewriting to be shown inside a panel — only re-parenting.

What genuinely has to change:

- The contract page (~770 lines) is currently a full page with its own header, its own back link and its own six-tab bar. Its body needs splitting into section components so it can live inside the project screen; the page shell around it gets dropped.
- The old `/project/:id/contract` address stays working (deep links, emails), but renders the project screen with the contract panel already open, rather than a separate page.
- Two duplicated sections (Photos, Activity) get deleted from the contract side.

**Estimate: one focused build pass.** Roughly: contract split + panel host (largest chunk), duplicate removal (small), deep-link handling and header persistence (small), styling pass so contract sections match the navy panels used elsewhere (small — three of six already match).

## 2. Merging duplicate Photos and Activity

Yes — the contract's Photos and Activity should be **filtered views of the project-level ones, not their own screens**.

- **Photos.** The project Photos panel already reads every photo for the job (site diary batches, stage updates, original listing) grouped by day. The contract copy shows the same underlying photos with no contract-specific meaning. Remove the contract Photos tab; where contract context matters (e.g. photos attached to a variation), surface those inline on the variation itself rather than as a whole tab.
- **Activity.** The project Activity feed already merges nine sources, contract events among them. The contract's Activity tab is the same feed narrowed to contract-related entries. Keep one feed component and give it an optional filter (contract-only / stage-only / all), so the contract panel and the stage workspace both reuse it. This also fixes the current mismatch where an event appears in one feed but not the other.

Net effect: eight project sections, six contract sections becomes eight project sections, four contract sections (Document, Bespoke, Variations, Commission).

## 3. Proposed structure

```text
Dashboard → Projects list
   └── Project screen  (header + dashboard link always visible)
         ├── Overview
         ├── Quote & Contract ──► contract panel (drawer over the screen)
         │        Document | Bespoke | Variations | Commission
         ├── Stages ──► stage panel (drawer)
         ├── Payments
         ├── Documents
         ├── Photos      (single source of truth)
         ├── Messages
         └── Activity    (single source of truth, filterable)
```

Rules the structure follows:

- The project header and the link back to the dashboard are rendered once, outside every panel, so they never scroll away or get buried.
- Opening a panel updates the address bar so links can still be shared and the browser back button closes the panel; closing returns to the exact section and scroll position the user was on.
- Nothing is more than two steps from the dashboard: dashboard → project → panel.
- Existing deep links (`/project/:id/contract`, wallet, compare) keep working and simply open the project screen with the right panel showing.

## Review order (piece by piece)

1. Panel host on the project screen + always-visible header (no content moved yet).
2. Contract body split into four sections, rendered in a panel; old address redirects into it.
3. Delete duplicate contract Photos and Activity; add the filter option to the shared Activity feed.
4. Styling consistency pass across the four contract sections.
5. Stages panel converted the same way (optional, can be deferred).

Nothing is built until each step is approved.
