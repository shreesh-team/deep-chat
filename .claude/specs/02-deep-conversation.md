# Spec: Chat Conversation UI Integration

## Overview

Implement the frontend UI for the chat conversation feature in the Next.js app, integrating with the existing backend API.

The UI must support:
- Starting a new conversation by selecting a model (provider is auto-detected)
- Only showing models whose provider has an API key configured in Settings
- Listing all conversations sorted by most recent activity
- Auto-opening the first (most recent) conversation on load
- Opening a conversation and viewing its full message history in order
- Sending messages within a conversation
- Cancelling a conversation
- Managing provider API keys via a Settings panel
- Displaying all error states clearly to the user

Base URL for all API calls is configurable via `NEXT_PUBLIC_API_URL`.


---

## Model → Provider Mapping

The app knows which provider owns each model. Users never type a provider name.

| Provider | `provider` value | Models |
|----------|-----------------|--------|
| Anthropic | `anthropic` | `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-3-haiku-20240307` |
| OpenAI | `openai` | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo` |
| Google | `google` | `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-pro` |

Any model not in the table falls back to provider `"unknown"`.

**Availability rule**: a model is only shown in the New Conversation modal if its provider has an API key saved in localStorage.


---

## UI Components

### A. ConversationSidebar

A scrollable panel listing all conversations, loaded on mount.

| Property | Detail |
|----------|--------|
| Data source | `GET /api/conversations` |
| Sort order | `updated_at DESC` (handled by API) |
| Empty state | "No conversations yet. Start one!" |
| Loading state | Skeleton rows |
| Footer | "Settings" button at the bottom |

### B. ConversationItem

A single row inside the sidebar.

| Field | Display rule |
|-------|-------------|
| `title` | Show as-is; fall back to `"Untitled"` if null |
| `model` | Small secondary label |
| `status` | Badge — green for `active`, red for `cancelled`, grey for `archived` |
| `updated_at` | Relative time (e.g., "2 min ago") with absolute time as hover tooltip |

### C. ConversationView

The main content area showing the full thread for the active conversation.

| Property | Detail |
|----------|--------|
| Data source | `GET /api/conversations/:id` |
| Message order | Ascending by `sequence` |
| Header | Shows `title` (or "Untitled"), `model`, `provider`, status badge |
| Cancelled state | Banner: "This conversation has been cancelled." |

### D. MessageBubble

A single message rendered inside ConversationView.

| `role` | Style |
|--------|-------|
| `user` | Right-aligned, primary colour |
| `assistant` | Left-aligned, muted background |
| `system` | Centred, italic, small text |

### E. MessageInput

Text input area at the bottom of ConversationView.

| State | Behaviour |
|-------|-----------|
| Active conversation | Enabled; Submit on Enter or button click |
| Cancelled conversation | Disabled with tooltip "Conversation is cancelled" |
| Loading (send in flight) | Disabled, shows spinner on button |

### F. NewConversationModal

A modal/dialog triggered by a "New Conversation" button.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `model` | Dropdown | Yes | Only lists models whose provider has an API key saved |
| `title` | Text input | No | Optional |

Provider is **not shown** — it is derived automatically from the selected model using the mapping table above and sent in the API request body.

**No models available state**: if no API keys are configured, the modal shows a prompt — "No providers configured. Add an API key in Settings first." with a link to open Settings.

On submit → `POST /api/conversations` → close modal → navigate to the new conversation.

### G. SettingsModal

A modal opened from the Settings button in the sidebar footer.

| Field | Detail |
|-------|--------|
| Trigger | "Settings" button at the bottom of ConversationSidebar |
| Providers shown | Anthropic, OpenAI, Google |
| Per-provider | Password input for API key + a green "Configured" dot when a key is saved |
| Persistence | `localStorage` under key `apiKey_<provider>` (e.g. `apiKey_anthropic`) |
| Save | Each provider saves independently via a "Save" button |
| Clear | Option to remove a saved key |

Saving a key immediately makes that provider's models available in NewConversationModal.


---

## API Endpoints

All endpoints are relative to `NEXT_PUBLIC_API_URL`.

### POST `/api/conversations`
```json
// Request
{
  "model": "claude-sonnet-4-5",
  "provider": "anthropic",
  "title": "Optional title"
}

// Response 201
{
  "id": "uuid",
  "title": null,
  "model": "claude-sonnet-4-5",
  "provider": "anthropic",
  "status": "active",
  "created_at": "2026-05-24T10:00:00Z",
  "updated_at": "2026-05-24T10:00:00Z"
}
```

### GET `/api/conversations`
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "What is Python?",
    "model": "claude-sonnet-4-5",
    "provider": "anthropic",
    "status": "active",
    "updated_at": "2026-05-24T10:05:00Z"
  }
]
```

### GET `/api/conversations/:id`
```json
// Response 200
{
  "id": "uuid",
  "title": "What is Python?",
  "status": "active",
  "model": "claude-sonnet-4-5",
  "provider": "anthropic",
  "messages": [
    { "id": "uuid", "role": "user",      "content": "What is Python?", "sequence": 0, "created_at": "..." },
    { "id": "uuid", "role": "assistant", "content": "Python is...",    "sequence": 1, "created_at": "..." }
  ]
}
```

### POST `/api/conversations/:id/messages`
```json
// Request
{
  "role": "user",
  "content": "Tell me more"
}

// Response 201
{
  "id": "uuid",
  "conversation_id": "uuid",
  "role": "user",
  "content": "Tell me more",
  "sequence": 2,
  "created_at": "2026-05-24T10:06:00Z"
}
```

### PATCH `/api/conversations/:id/cancel`
```json
// Response 200
{
  "id": "uuid",
  "status": "cancelled"
}
```


---

## TypeScript Types

```ts
type ConversationStatus = 'active' | 'cancelled' | 'archived'
type MessageRole = 'user' | 'assistant' | 'system'
type Provider = 'anthropic' | 'openai' | 'google' | 'unknown'

interface Conversation {
  id: string
  title: string | null
  model: string
  provider: string
  status: ConversationStatus
  created_at: string   // ISO 8601
  updated_at: string   // ISO 8601
}

interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  sequence: number
  created_at: string   // ISO 8601
}

interface ConversationDetail extends Omit<Conversation, 'created_at'> {
  messages: Message[]
}

interface ApiError {
  error: {
    code: string
    message: string
  }
}

interface ModelInfo {
  model: string
  provider: Provider
  label: string   // display name, e.g. "Claude Sonnet 4.5"
}
```


---

## User Flows

### Flow 1 — Start a new conversation
1. User clicks "New Conversation"
2. `NewConversationModal` opens showing only models for configured providers
3. If no API keys configured → show "Add an API key in Settings first" prompt
4. User selects a model and optionally sets a title
5. Provider is derived automatically from selected model
6. On submit → `POST /api/conversations`
7. On success → close modal, navigate to `/conversations/:id`
8. On error → show inline error in modal

### Flow 2 — Browse conversations
1. App loads → `GET /api/conversations`
2. `ConversationSidebar` renders the list
3. **First conversation is automatically selected and opened** (`/conversations/<first-id>`)
4. If list is empty → stay on empty state page
5. User clicks an item → navigate to `/conversations/:id`

### Flow 3 — View a conversation
1. Route `/conversations/:id` mounts
2. `GET /api/conversations/:id`
3. Render header + messages in sequence order
4. If `status === 'cancelled'` → show banner + disable input

### Flow 4 — Send a message
1. User types in `MessageInput` and presses Enter or Send
2. Optimistically append the message to the thread
3. `POST /api/conversations/:id/messages` with `role: "user"`
4. On success → confirm the optimistic message (update id/timestamps)
5. On error → remove optimistic message, show toast

### Flow 5 — Cancel a conversation
1. User clicks "Cancel Conversation" button in the header
2. Confirmation dialog: "Cancel this conversation? You won't be able to send more messages."
3. On confirm → `PATCH /api/conversations/:id/cancel`
4. On success → update status badge, show cancelled banner, disable input

### Flow 6 — Manage API keys (Settings)
1. User clicks "Settings" in sidebar footer
2. `SettingsModal` opens showing Anthropic, OpenAI, Google with their current key status
3. User pastes an API key and clicks "Save"
4. Key saved to `localStorage` under `apiKey_<provider>`
5. Modal closes; the provider's models are now available in NewConversationModal


---

## UI / UX Rules

1. `MessageInput` must be visually disabled and non-interactive when `status !== 'active'`.
2. Messages render in ascending `sequence` order. Never rely on `created_at` for ordering.
3. Display `"Untitled"` wherever `title` is `null`.
4. `updated_at` in the sidebar renders as relative time; use absolute time in a tooltip on hover.
5. Optimistic updates on send — revert on failure.
6. The sidebar re-fetches (or updates in-place) after a new message is sent, so `updated_at` sort stays accurate.
7. Do not expose raw error codes to users — map them to friendly messages (see Error Handling below).
8. **On initial load, if the conversation list is non-empty, automatically navigate to the first conversation.**
9. Only models belonging to providers with a saved API key are shown in NewConversationModal. Provider is never entered manually.


---

## Error Handling

All API errors follow this envelope:
```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "No conversation found with id abc-123"
  }
}
```

| `error.code` | User-facing message | Where to show |
|---|---|---|
| `CONVERSATION_NOT_FOUND` | "Conversation not found." | Redirect to list + toast |
| `CONVERSATION_CANCELLED` | "This conversation has been cancelled." | Inline banner, disable input |
| `MISSING_FIELD` | Inline field validation message | Form field error |
| `INTERNAL_ERROR` | "Something went wrong. Please try again." | Toast |
| Network / timeout | "Could not reach server. Check your connection." | Toast |


---

## Definition of Done

1. A new conversation can be created from the UI by selecting a model (provider auto-detected).
2. Only models for configured providers appear in the model dropdown.
3. All conversations are listed in the sidebar, sorted by most recently updated.
4. The first conversation is automatically opened on load.
5. Clicking a conversation loads its full message history in sequence order.
6. A message can be sent; it appears in the thread immediately (optimistic) and persists.
7. Cancelled conversations show a banner and have the input disabled.
8. A conversation can be cancelled from the UI; the status updates immediately.
9. All error codes from the API map to a clear, user-friendly message.
10. `title = null` is handled gracefully everywhere with an "Untitled" fallback.
11. API keys can be added and removed via the Settings modal; changes take effect immediately in NewConversationModal.
