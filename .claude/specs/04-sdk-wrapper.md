# Feature: Inference Logs Dashboard (SDK Observability UI)

## Problem

Developers using the DeepX SDK to instrument their LLM calls have no way to see the data being captured. The backend ingests inference metadata — latency, token counts, model, status, previews — but there is no interface to browse, filter, or inspect these records. Without visibility into logged calls, the SDK's value is invisible and developers cannot act on the observability data they are collecting.

## Goal

A developer can open the DeepX web app and immediately see a live, browseable log of every LLM call their SDK has recorded — including what was sent, what came back, how fast it was, how many tokens were used, and whether it succeeded or failed.

---

## User Stories

- As a **developer**, I want to see a list of all logged inference calls so that I can verify my SDK integration is working.
- As a **developer**, I want to filter inference logs by status (success/error) so that I can quickly find and investigate failed calls.
- As a **developer**, I want to see latency and token counts for each call so that I can spot performance regressions at a glance.
- As a **developer**, I want to click on a log entry and read the input and output previews so that I can understand what was sent and received.
- As a **developer**, I want to filter logs by conversation ID so that I can trace a complete multi-turn interaction end to end.
- As a **developer**, I want to see an error message when a call failed so that I can diagnose the root cause without leaving the dashboard.

---

## Scope

### In Scope
- A dedicated **Inference Logs** page listing all captured SDK calls, paginated and ordered newest-first
- Per-row display of: timestamp, model, provider, status badge (success/error), latency (ms), total token count, and conversation ID (if present)
- A detail panel or modal opened by clicking a row, showing: full input preview, full output preview, error message (if any), input/output/total token breakdown, exact request and response timestamps
- Filter bar: filter by status (success / error / all), model name, and conversation ID
- A status badge that is visually distinct — green for success, red for error
- Empty state when no logs exist yet (with a hint to integrate the SDK)

### Out of Scope
- Charts or aggregate analytics (latency over time, error rate graphs) — that is a separate analytics feature
- Real-time streaming updates (page refresh is acceptable for now)
- Editing or deleting log entries
- Exporting logs as CSV or JSON
- Filtering by date range in the initial release
- User-level access control (all logs visible to any authenticated user)

---

## User Flow

1. User navigates to the **Inference Logs** section from the main navigation.
2. The page loads showing a table of logged SDK calls, newest first.
3. Each row shows: relative timestamp ("2 minutes ago"), model name, provider, a coloured status badge, latency in milliseconds, total token count, and conversation ID (or a dash if absent).
4. User can type in a filter box to filter by conversation ID, or select "Errors only" from a dropdown to narrow the list.
5. User clicks a row to open a detail panel on the right (or a modal).
6. The detail panel shows the full input preview and output preview in readable, scrollable text areas, the token breakdown (input / output / total), exact timestamps for when the request was made and when the response arrived, and — if the call failed — the error message in a highlighted block.
7. User closes the panel and returns to the list.
8. If no logs have been recorded yet, the page shows an empty state message explaining that no calls have been logged and prompting the user to integrate the SDK.

---

## Edge Cases & Constraints

- **No conversation ID**: rows without a conversation ID show a dash in that column; the filter field for conversation ID is hidden or disabled when empty.
- **Long previews**: input and output previews may be up to 500 characters; the detail panel must scroll gracefully and not overflow the layout.
- **Error calls with no output**: if status is `error`, the output preview area shows the error message instead of an empty box.
- **Missing token counts**: some calls may have null token counts (provider did not return usage); these cells show a dash rather than 0.
- **Large log volume**: the list is paginated (e.g. 50 rows per page) so that pages with thousands of logs remain fast to load.
- **Latency display**: latency under 1000 ms shows as `423 ms`; above 1000 ms shows as `1.4 s` for readability.
- **Stale data**: since the page does not auto-refresh, a manual refresh button or last-updated timestamp should be visible so the user knows the data is a snapshot.

---

## Definition of Done

1. User can navigate to an Inference Logs page and see a paginated list of all SDK-captured calls ordered newest-first.
2. Each list row shows timestamp, model, provider, status badge (green/red), latency, token count, and conversation ID.
3. Clicking any row opens a detail view with input preview, output preview, token breakdown (input/output/total), request and response timestamps, and error message when applicable.
4. User can filter the list to show only success or only error calls, and results update immediately.
5. User can type a conversation ID into a filter field and see only calls matching that ID.
6. Calls with no conversation ID, no token counts, or no output preview display dashes rather than blank or broken cells.
7. When no logs exist, the page shows an empty state message (not a blank table).
8. The detail panel scrolls without breaking the page layout for previews up to 500 characters.
