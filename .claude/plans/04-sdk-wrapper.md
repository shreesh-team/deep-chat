# Implementation Plan: Inference Logs Dashboard

## Context

Developers using the DeepX SDK have no UI to inspect the inference calls being captured by the backend. The backend already ingests metadata (latency, tokens, model, status, previews) via SDK instrumentation. This feature builds a browseable, filterable Inference Logs page in the existing Next.js app, giving developers immediate visibility into what the SDK is recording.

Spec: `.claude/specs/04-sdk-wrapper.md`

---

## Approach

Add the Inference Logs feature as a new route **`/conversations/logs`** — this falls under `app/conversations/layout.tsx`, which provides the auth guard, two-column sidebar shell, toast system, and `ConversationsContext` for free, with zero layout refactoring. Next.js App Router prefers static segments over dynamic `[id]`, so `/conversations/logs` will never be caught by the conversation detail route.

---

## Files Created

### `app/conversations/logs/page.tsx`
Client component owning all page state: filters (`status`, `model`, `conversationId`), current page, selected log ID, and the fetched `InferenceLogsPage`. Uses the same `useEffect` + cleanup flag pattern as `app/conversations/[id]/page.tsx`. Filter changes reset page to 1 and clear selection via `handleFiltersChange`.

### `components/InferenceLogsView.tsx`
Main UI component. Renders:
- **Filter bar**: status dropdown (All / Success / Error), model text input, conversation ID text input, Refresh button with last-updated timestamp
- **Table**: columns — Timestamp, Model, Provider, Status badge, Latency, Tokens, Conversation ID
- **Pagination**: prev/next buttons + "Page N of M" indicator (50 rows/page)
- **Empty state**: centered icon + "No inference logs yet — integrate the SDK"
- **Loading skeleton**: 8 pulsing rows while fetching

### `components/InferenceLogDetail.tsx`
Right-side panel (flex sibling at 40% width) opened when a row is clicked. Shows:
- Request & response timestamps (`absoluteTime` from `lib/relativeTime.ts`)
- Input preview in scrollable `<pre>` (max-h-48, overflow-y-auto)
- Output preview or error block (red-50 background) if status is `error`
- Token breakdown: Input / Output / Total (dash for null values)
- Provider, Conversation ID, Log ID
- Close (×) button at top-right

---

## Files Modified

### `types/index.ts`
Added:
```typescript
interface InferenceLog {
  id: string
  conversation_id: string | null
  model: string
  provider: string
  status: 'success' | 'error'
  latency_ms: number | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  input_preview: string | null
  output_preview: string | null
  error_message: string | null
  request_at: string
  response_at: string | null
  created_at: string
}

interface InferenceLogsPage {
  items: InferenceLog[]
  total: number
  page: number
  page_size: number
}
```

### `lib/api.ts`
Added `api.getInferenceLogs(params)`:
```typescript
// GET /api/inference-logs?status=&model=&conversation_id=&page=&page_size=50
getInferenceLogs(params: {
  status?: 'success' | 'error'
  model?: string
  conversation_id?: string
  page?: number
  page_size?: number
}): Promise<InferenceLogsPage>
```

### `components/ConversationSidebar.tsx`
Added "Inference Logs" nav button in the top section (below "New Conversation"). Uses `usePathname()` to highlight when active (`pathname.startsWith('/conversations/logs')`). Navigates via `router.push('/conversations/logs')`.

---

## Key Design Decisions

- **Route placement**: `/conversations/logs` inherits auth guard, sidebar, and toast system from the existing conversations layout — no structural refactoring needed.
- **Status badges**: Rendered inline (not via `StatusBadge` component which only types `ConversationStatus`). Green pill for success, red for error.
- **Detail panel**: Flex sibling (60/40 split) rather than modal overlay — matches spec's "detail panel on the right."
- **Latency format**: `423 ms` under 1000 ms, `1.4 s` at/above.
- **Null values**: Token counts and missing conversation IDs render as `—`.
- **Stale data**: "Updated X ago" timestamp + manual Refresh button visible at all times.

---

## Expected Backend API Contract
  
```
GET /api/inference-logs
  Query params: status, model, conversation_id, page (1-indexed), page_size
  Response: { items: InferenceLog[], total: number, page: number, page_size: number }
```

If backend field names differ from the above, update `lib/api.ts:getInferenceLogs`.

---

## Verification

1. `npm run dev` → navigate to `/conversations/logs`
2. Sidebar shows "Inference Logs" link, highlighted when active
3. Table renders rows with correct column data; status badges are green/red
4. Click a row → detail panel opens with input/output, token breakdown, timestamps
5. Status filter and conversation ID filter narrow results; "Clear filters" resets
6. Empty result or no logs → empty state message shown (not blank table)
7. `npm run lint` → zero errors ✓
8. `npx tsc --noEmit` → zero errors ✓
