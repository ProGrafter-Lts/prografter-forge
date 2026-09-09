# Planning Pipeline admin redesign

## Goal
Rework the existing Planning Pipeline into a premium ProGrafter control-room interface that matches the supplied mock-up and newer dashboard/project screens, while preserving every current query, mutation, filter, route, print action and admin workflow.

## What will change
- Restyle the existing admin header as a slim navy/teal bar while keeping its current logo and navigation destinations.
- Combine the page title, headline metrics and the two ingest/scraper actions into a compact top command area.
- Present funnel stages, daily workload chips and workspace tabs as dense, scan-friendly strips.
- Rebuild the Leads workspace as a stable split view:
  - compact, single-line quick filters with horizontal overflow where necessary;
  - search, value, sort and skipped controls arranged in one dense toolbar on desktop;
  - shorter lead rows so more records remain visible;
  - a larger, calmer detail pane with clear metadata and compact actions.
- Restyle the selected lead’s Next Action, homeowner, architect/agent, outcome, planning details, activity and notes sections without changing their actions or data.
- Carry the same visual system through Letter Batch, Architects & Agents and Insights so the whole admin area feels cohesive.
- Preserve the existing mobile list-to-detail navigation, with horizontally scrolling filters and stacked detail content.

## Visual direction
- Deep navy layered surfaces with restrained teal/cyan accents.
- Existing ProGrafter heading/body typography and genuine logo.
- Subtle blueprint grid/linework and faded architectural imagery only in major background areas.
- Compact controls, clear white hierarchy, muted secondary text and restrained status colours.
- No unnecessary animation or marketing-style content.

## Functional safeguards
- Keep the existing `planning_leads`, `planning_agents` and event-loading behaviour unchanged.
- Keep all quick-view rules, historic handling, sorting, value bands, skipped visibility and pagination unchanged.
- Keep council/PDF links, URL editing, clipboard actions, PDF enrichment, skip/restore and letter-batch actions unchanged.
- Keep contact logging, templates, outcomes, notes, batch printing/export/sent recording, ingest and agent/insight views unchanged.
- Do not alter routes, authentication, database schema, calculations or backend functions.

## Verification
- Run the existing TypeScript validation.
- Check the live page at desktop and mobile sizes when an authenticated admin session is available.
- Confirm controls remain reachable and that desktop filters do not wrap into wasteful multi-row layouts.
