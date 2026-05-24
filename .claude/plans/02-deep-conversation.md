# Plan: Chat Conversation UI (Spec 02)

## Context

The existing app (`app/page.tsx`) is a 397-line prototype with hardcoded chat history and no real API integration. This plan implements the full conversation UI from spec `02-deep-conversation.md` — a two-panel layout (sidebar + view) that talks to a backend at `NEXT_PUBLIC_API_URL`.

**Three clarifications applied over the original plan:**
1. **Settings modal** — user manages API keys per provider (localStorage). Settings button lives in sidebar footer.
2. **Provider auto-detection** — `lib/models.ts` defines the model→provider mapping. `NewConversationModal` only shows a model dropdown (no provider field); provider is derived from the chosen model. Only models for providers with a saved API key are shown.
3. **Auto-open first conversation** — after the conversation list loads, if it is non-empty the layout navigates to `/conversations/<first-id>` automatically.

---

## File Structure

### New files
```
types/index.ts                          ← All shared TypeScript interfaces + Provider type
lib/api.ts                              ← fetch wrapper, typed API functions, ApiError class
lib/relativeTime.ts                     ← relativeTime() + absoluteTime() using Intl.RelativeTimeFormat
lib/errorMessages.ts                    ← error code → friendly string map
lib/useToast.ts                         ← useToast hook (id, message, type, auto-dismiss 4s)
lib/models.ts                           ← MODEL_LIST, getProviderForModel(), getAvailableModels()

components/StatusBadge.tsx              ← green/red/grey dot badge by status
components/Toast.tsx                    ← single toast card (error/success/info colors)
components/ToastContainer.tsx           ← fixed bottom-right stack
components/ConfirmDialog.tsx            ← generic yes/no modal
components/MessageBubble.tsx            ← role-based bubble: user=right, assistant=left, system=center
components/ConversationItem.tsx         ← sidebar row: title, model, StatusBadge, relative time
components/ConversationSidebar.tsx      ← scrollable list, New Conversation button, Settings footer button
components/MessageInput.tsx             ← textarea, disabled when cancelled/sending, spinner on button
components/NewConversationModal.tsx     ← model dropdown (filtered by saved API keys) + title + auto provider
components/SettingsModal.tsx            ← API key management per provider, localStorage persistence
components/ConversationView.tsx         ← header + messages scroll area + MessageInput + ConfirmDialog

app/conversations/layout.tsx            ← auth guard, ConversationsContext, sidebar+children, auto-open first
app/conversations/page.tsx              ← empty state: "Select a conversation"
app/conversations/[id]/page.tsx         ← fetches detail, renders ConversationView
```

### Modified files
```
app/page.tsx          ← redirect-only to /conversations
```

---

## Architecture

### Routing
`app/conversations/layout.tsx` is `"use client"`, renders `<ConversationSidebar>` left + `{children}` right. Sidebar state persists across navigation within the segment.

### State (ConversationsContext)
```ts
{
  conversations: Conversation[]
  loading: boolean
  refresh: () => Promise<void>
  addToast: (message: string, type: 'success' | 'error' | 'info') => void
}
```

### State ([id]/page.tsx — local)
```ts
state: { loadedId: string | null, detail: ConversationDetail | null, error: string | null }
retryCount: number   // incremented to trigger re-fetch
```

---

## Key Implementation Details

### lib/models.ts — model-to-provider mapping
```ts
export type Provider = 'anthropic' | 'openai' | 'google' | 'unknown'

export interface ModelInfo {
  model: string        // API value sent to backend
  label: string        // display name
  provider: Provider
}

export const MODEL_LIST: ModelInfo[] = [
  { model: 'claude-opus-4-7',             label: 'Claude Opus 4.7',         provider: 'anthropic' },
  { model: 'claude-sonnet-4-6',           label: 'Claude Sonnet 4.6',       provider: 'anthropic' },
  { model: 'claude-haiku-4-5',            label: 'Claude Haiku 4.5',        provider: 'anthropic' },
  { model: 'claude-sonnet-4-5',           label: 'Claude Sonnet 4.5',       provider: 'anthropic' },
  { model: 'gpt-4o',                      label: 'GPT-4o',                  provider: 'openai'    },
  { model: 'gpt-4o-mini',                 label: 'GPT-4o Mini',             provider: 'openai'    },
  { model: 'gpt-4-turbo',                 label: 'GPT-4 Turbo',             provider: 'openai'    },
  { model: 'gpt-3.5-turbo',               label: 'GPT-3.5 Turbo',          provider: 'openai'    },
  { model: 'gemini-2.0-flash',            label: 'Gemini 2.0 Flash',        provider: 'google'    },
  { model: 'gemini-1.5-pro',              label: 'Gemini 1.5 Pro',          provider: 'google'    },
  { model: 'gemini-1.5-flash',            label: 'Gemini 1.5 Flash',        provider: 'google'    },
]

// Returns the provider string for a given model id, 'unknown' if not found
export function getProviderForModel(model: string): Provider { ... }

// Returns only models whose provider has a key saved in localStorage
export function getAvailableModels(): ModelInfo[] { ... }

// localStorage key convention: apiKey_anthropic, apiKey_openai, apiKey_google
export const API_KEY_PREFIX = 'apiKey_'
export function getApiKey(provider: Provider): string | null { ... }
export function setApiKey(provider: Provider, key: string): void { ... }
export function removeApiKey(provider: Provider): void { ... }
```

### lib/api.ts
```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error { code: string; status: number }

// Reads Bearer token from localStorage("user")
async function apiFetch<T>(path, init?): Promise<T>

export const api = {
  getConversations, getConversation, createConversation, sendMessage, cancelConversation
}
```

### NewConversationModal changes
- **No provider field** — provider derived from selected model via `getProviderForModel()`
- Model dropdown populated by `getAvailableModels()` (only providers with keys)
- Grouped by provider in the dropdown: "Anthropic", "OpenAI", "Google" as `<optgroup>` labels
- If `getAvailableModels()` returns empty → show inline prompt: "No providers configured. Open Settings to add an API key."
- On submit: `api.createConversation({ model, provider: getProviderForModel(model), title })`

### SettingsModal
```
Providers: Anthropic · OpenAI · Google
Each row:
  - Provider name + icon
  - Green dot if key is saved
  - Password <input> (shows masked key if saved, placeholder "sk-..." otherwise)
  - "Save" button (calls setApiKey, shows "Saved ✓" for 2s)
  - "Remove" button (only when key exists, calls removeApiKey)
```
Opened from a "Settings" button in the ConversationSidebar footer. Same backdrop/card pattern as other modals.

### Auto-open first conversation (layout.tsx)
After `GET /api/conversations` resolves and the list is non-empty:
```ts
// In the .then() callback after loading conversations:
if (data.length > 0 && pathname === '/conversations') {
  router.replace(`/conversations/${data[0].id}`)
}
```
Uses `router.replace` (not `push`) so the empty state is not in browser history.

### Relative time (no date-fns)
```ts
// lib/relativeTime.ts — uses Intl.RelativeTimeFormat("en", {numeric:"auto"})
relativeTime(isoDate: string): string    // "2 min ago"
absoluteTime(isoDate: string): string   // "May 24, 2026, 10:05 AM"
```

### Optimistic send flow
1. Append `{ id: "temp-" + Date.now(), isOptimistic: true }` to `optimisticMessages` state
2. POST `/api/conversations/:id/messages`
3. **Success**: clear `optimisticMessages`, call `onUpdate({ messages: [...detail.messages, saved] })` → `refresh()`
4. **Failure**: clear `optimisticMessages` → `addToast(getFriendlyError(err.code), "error")`

### Error mapping
```
CONVERSATION_NOT_FOUND → "Conversation not found."         redirect to list + toast
CONVERSATION_CANCELLED → "This conversation has been cancelled."  inline banner
MISSING_FIELD          → "Please fill in all required fields."    form field error
INTERNAL_ERROR         → "Something went wrong. Please try again."
NETWORK_ERROR          → "Could not reach server. Check your connection."
```

### Styling conventions
- Modals: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]`
- Cards: `bg-white rounded-2xl shadow-xl border border-gray-100`
- Inputs: `bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5`
- Primary button: `bg-gray-900 text-white hover:bg-gray-700 rounded-xl`
- Configured dot: `w-2 h-2 rounded-full bg-green-500`

---

## Build Order

1. `types/index.ts` + `lib/models.ts` + `lib/api.ts` + `lib/relativeTime.ts` + `lib/errorMessages.ts` + `lib/useToast.ts`
2. `components/StatusBadge.tsx` + `components/MessageBubble.tsx` + `components/ConfirmDialog.tsx`
3. `components/Toast.tsx` + `components/ToastContainer.tsx`
4. `components/SettingsModal.tsx`
5. `components/ConversationItem.tsx` + `components/ConversationSidebar.tsx` (with Settings button in footer)
6. `components/MessageInput.tsx` + `components/NewConversationModal.tsx` (model-only, no provider field)
7. `components/ConversationView.tsx`
8. `app/conversations/layout.tsx` (with auto-open first conversation logic)
9. `app/conversations/page.tsx` → `app/conversations/[id]/page.tsx`
10. `app/page.tsx` (redirect) + `.env.local`

---

## Environment Setup
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Verification

1. `npm run dev` — dev server at http://localhost:3000
2. `/` → redirects to `/conversations`
3. No API keys saved → New Conversation modal shows "Add an API key in Settings first"
4. Settings → add Anthropic key → Anthropic models appear in modal
5. Create conversation → provider auto-set from model → navigate to `/conversations/:id`
6. On reload with existing conversations → first conversation auto-opens
7. Send message → optimistic, then confirmed
8. Cancel flow → confirm dialog → banner + disabled input
9. Remove API key in Settings → those models disappear from modal immediately
10. `npm run lint` — zero errors
