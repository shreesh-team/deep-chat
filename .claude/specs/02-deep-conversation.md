# Spec: Chat Conversation UI Integration

## Overview

Implement the frontend UI for the chat conversation feature in the Next.js app, integrating with the existing backend API.

The UI must support:
- Starting a new conversation by selecting a model and provider
- Listing all conversations sorted by most recent activity
- Opening a conversation and viewing its full message history in order
- Sending messages within a conversation
- Cancelling a conversation
- Displaying all error states clearly to the user

Base URL for all API calls is configurable via `NEXT_PUBLIC_API_URL`.


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

### B. ConversationItem

A single row inside the sidebar.

| Field | Display rule |
|-------|-------------|
| `title` | Show as-is; fall back to `"Untitled"` if null |
| `model` | Small secondary label |
| `status` | Badge — green for `active`, red for `cancelled`, grey for `archived` |
| `updated_at` | Relative time (e.g., "2 min ago") |

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

| Field | Type | Required |
|-------|------|----------|
| `model` | Text input or dropdown | Yes |
| `provider` | Text input or dropdown | Yes |
| `title` | Text input | No (optional) |

On submit → `POST /api/conversations` → close modal → navigate to the new conversation.


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
```


---

## User Flows

### Flow 1 — Start a new conversation
1. User clicks "New Conversation"
2. `NewConversationModal` opens
3. User fills `model`, `provider`, optionally `title`
4. On submit → `POST /api/conversations`
5. On success → close modal, navigate to `/conversations/:id`
6. On error → show inline error in modal

### Flow 2 — Browse conversations
1. App loads → `GET /api/conversations`
2. `ConversationSidebar` renders the list
3. User clicks an item → navigate to `/conversations/:id`

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


---

## UI / UX Rules

1. `MessageInput` must be visually disabled and non-interactive when `status !== 'active'`.
2. Messages render in ascending `sequence` order. Never rely on `created_at` for ordering.
3. Display `"Untitled"` wherever `title` is `null`.
4. `updated_at` in the sidebar renders as relative time; use absolute time in a tooltip on hover.
5. Optimistic updates on send — revert on failure.
6. The sidebar re-fetches (or updates in-place) after a new message is sent, so `updated_at` sort stays accurate.
7. Do not expose raw error codes to users — map them to friendly messages (see Error Handling below).


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

1. A new conversation can be created from the UI with a model and provider.
2. All conversations are listed in the sidebar, sorted by most recently updated.
3. Clicking a conversation loads its full message history in sequence order.
4. A message can be sent; it appears in the thread immediately (optimistic) and persists.
5. Cancelled conversations show a banner and have the input disabled.
6. A conversation can be cancelled from the UI; the status updates immediately.
7. All error codes from the API map to a clear, user-friendly message.
8. `title = null` is handled gracefully everywhere with an "Untitled" fallback.
