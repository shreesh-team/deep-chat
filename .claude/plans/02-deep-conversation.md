# Plan: Chat Conversation UI (Spec 02)

## Context

The existing app (`app/page.tsx`) is a 397-line prototype with hardcoded chat history and no real API integration. This plan implements the full conversation UI from spec `02-deep-conversation.md` — a two-panel layout (sidebar + view) that talks to a backend at `NEXT_PUBLIC_API_URL`. The home page becomes a redirect to `/conversations`.

---

## File Structure

### New files to create
```
types/index.ts                          ← All shared TypeScript interfaces
lib/api.ts                              ← fetch wrapper, typed API functions, ApiError class
lib/relativeTime.ts                     ← relativeTime() + absoluteTime() using Intl.RelativeTimeFormat
lib/errorMessages.ts                    ← error code → friendly string map
lib/useToast.ts                         ← useToast hook (id, message, type, auto-dismiss 4s)

components/StatusBadge.tsx              ← green/red/grey dot badge by status
components/Toast.tsx                    ← single toast card (error/success/info colors)
components/ToastContainer.tsx           ← fixed bottom-right stack, drives from props
components/ConfirmDialog.tsx            ← generic yes/no modal (backdrop + card pattern)
components/MessageBubble.tsx            ← role-based bubble: user=right, assistant=left, system=center
components/ConversationItem.tsx         ← sidebar row: title, model, StatusBadge, relative time
components/ConversationSidebar.tsx      ← scrollable list, New Conversation button, skeleton/empty states
components/MessageInput.tsx             ← textarea, disabled when cancelled/sending, spinner on button
components/NewConversationModal.tsx     ← model+provider+title form, POST /api/conversations
components/ConversationView.tsx         ← header + messages scroll area + MessageInput + ConfirmDialog

app/conversations/layout.tsx            ← auth guard, ConversationsContext provider, sidebar+children layout
app/conversations/page.tsx              ← empty state: "Select a conversation"
app/conversations/[id]/page.tsx         ← fetches detail, renders ConversationView
```

### Modified files
```
app/page.tsx                            ← Replace with redirect-only to /conversations
```

---

## Architecture

### Routing
`app/conversations/layout.tsx` is a `"use client"` shared layout that renders `<ConversationSidebar>` on the left and `{children}` on the right (`flex h-screen overflow-hidden`). Sidebar state persists across navigation within the segment.

### State (ConversationsContext)
Defined in `app/conversations/layout.tsx`, provides to all children:
```ts
{
  conversations: Conversation[]
  loading: boolean
  refresh: () => Promise<void>    // called after send/create
  addToast: (msg: string, type) => void
}
```

### State ([id]/page.tsx — local)
```ts
state: { loadedId, detail, error }   // single object, updated only in async callbacks
retryCount: number                   // incremented to trigger re-fetch
```

---

## Key Implementation Details

### lib/api.ts
```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error { code: string; status: number }

async function apiFetch<T>(path, init?): Promise<T>
  // adds Content-Type + Bearer token from localStorage("user")
  // on !res.ok → throws ApiError(body.error.code, body.error.message, status)

export const api = {
  getConversations, getConversation, createConversation, sendMessage, cancelConversation
}
```

### Relative time (no date-fns)
```ts
// lib/relativeTime.ts — uses Intl.RelativeTimeFormat("en", {numeric:"auto"})
relativeTime(isoDate: string): string    // "2 min ago"
absoluteTime(isoDate: string): string   // "May 24, 2026, 10:05 AM"
```

In `ConversationItem`: `title={absoluteTime(updated_at)}` on the wrapper `<button>` gives a free browser tooltip.

### Toast
`useToast` returns `{toasts, addToast, removeToast}`. Auto-dismisses after 4000ms via `setTimeout`. `addToast` is surfaced through `ConversationsContext` so any nested component can call it. `<ToastContainer>` is `fixed bottom-4 right-4 z-50 flex flex-col gap-2`.

### Optimistic send flow
1. Append `{ id: "temp-" + Date.now(), isOptimistic: true, ...fields }` to `optimisticMessages` state
2. POST `/api/conversations/:id/messages`
3. **Success**: clear `optimisticMessages`, call `onUpdate({ messages: [...detail.messages, saved] })` → `refresh()`
4. **Failure**: clear `optimisticMessages` → `addToast(getFriendlyError(err.code), "error")`

### Error mapping (lib/errorMessages.ts)
```ts
CONVERSATION_NOT_FOUND → "Conversation not found."        // redirect to list + toast
CONVERSATION_CANCELLED → "This conversation has been cancelled."  // inline banner
MISSING_FIELD          → "Please fill in all required fields."    // form field error
INTERNAL_ERROR         → "Something went wrong. Please try again."
Network/timeout        → "Could not reach server. Check your connection."
```

### Styling conventions (match existing palette)
- Modals: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]`
- Cards: `bg-white rounded-2xl shadow-xl border border-gray-100`
- Inputs: `bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5`
- Primary button: `bg-gray-900 text-white hover:bg-gray-700 rounded-xl`
- Error banner: `bg-red-50 border border-red-100 text-red-600`
- Cancelled banner: `bg-amber-50 border-b border-amber-100 text-amber-700`
- Skeleton: `animate-pulse bg-gray-100 rounded-lg`

### Message bubbles
- `user`: `ml-auto bg-gray-900 text-white rounded-2xl rounded-br-sm max-w-[70%] px-4 py-3 text-sm`
- `assistant`: `mr-auto bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm max-w-[70%] px-4 py-3 text-sm`
- `system`: `mx-auto text-center text-xs text-gray-400 italic px-2`

### title = null handling
Single helper `getTitle(c) => c.title ?? "Untitled"` defined in `types/index.ts`, used everywhere.

### Cancel flow
1. Click "Cancel" button in ConversationView header (only shown when `status === "active"`)
2. `<ConfirmDialog>` opens: "Cancel this conversation? You won't be able to send more messages."
3. On confirm → `api.cancelConversation(id)` → update local detail status → `refresh()`

---

## Build Order

1. `types/index.ts` + `lib/api.ts` + `lib/relativeTime.ts` + `lib/errorMessages.ts` + `lib/useToast.ts`
2. `components/StatusBadge.tsx` + `components/MessageBubble.tsx` + `components/ConfirmDialog.tsx`
3. `components/Toast.tsx` + `components/ToastContainer.tsx`
4. `components/ConversationItem.tsx` + `components/ConversationSidebar.tsx`
5. `components/MessageInput.tsx` + `components/NewConversationModal.tsx`
6. `components/ConversationView.tsx`
7. `app/conversations/layout.tsx` → `app/conversations/page.tsx` → `app/conversations/[id]/page.tsx`
8. `app/page.tsx` (redirect) + `.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:8000`)

---

## Environment Setup
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Verification

1. `npm run dev` — dev server at http://localhost:3000
2. `/` → redirects to `/conversations`
3. Auth guard: unauthenticated → redirects to `/login`
4. "New Conversation" → modal opens, fill model/provider → POST creates conversation → navigate to `/conversations/:id`
5. Send a message → appears immediately (optimistic), persists after API response
6. Sidebar `updated_at` refreshes after send
7. Cancel flow: confirm dialog → banner appears, input disabled
8. `title = null` → "Untitled" shown everywhere
9. Network error → toast: "Could not reach server."
10. `npm run lint` — no TypeScript or ESLint errors
