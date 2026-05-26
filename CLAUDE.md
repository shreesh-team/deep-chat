# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint (Next.js core-web-vitals + TypeScript rules)
```

No test suite is configured yet.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5** (strict mode)
- **Tailwind CSS v4** — configured via `postcss.config.mjs`; utility classes only, no `tailwind.config`
- **react-markdown + remark-gfm** — renders assistant message content as Markdown
- **Geist Sans / Geist Mono** loaded via `next/font/google` in `app/layout.tsx`

## Architecture

### Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `app/page.tsx` | Redirects to `/conversations` |
| `/conversations` | `app/conversations/page.tsx` | Empty-state placeholder |
| `/conversations/[id]` | `app/conversations/[id]/page.tsx` | Conversation detail & chat |
| `/login` | `app/login/page.tsx` | Email/password login |
| `/register` | `app/register/page.tsx` | New account registration |

`app/conversations/layout.tsx` wraps both conversation routes with the sidebar shell and provides `ConversationsContext`.

### Components (`components/`)

| Component | Role |
|---|---|
| `ConversationSidebar` | Left-rail list of conversations + new/settings buttons |
| `ConversationItem` | Single row in the sidebar |
| `ConversationView` | Main chat panel (message list + input) |
| `MessageBubble` | Individual message; renders Markdown for assistant role |
| `MessageInput` | Textarea + send button at bottom of chat |
| `NewConversationModal` | Modal to pick model/provider and create a conversation |
| `SettingsModal` | Modal to set API keys per provider |
| `ConfirmDialog` | Generic confirmation dialog |
| `StatusBadge` | Pill showing conversation status |
| `Toast` / `ToastContainer` | Ephemeral notification toasts |

### State & Context

`ConversationsLayout` owns top-level state and exposes it via `ConversationsContext`:
- `conversations` — list of `Conversation` objects
- `loading` — initial fetch in progress
- `refresh()` — re-fetches the conversation list
- `addToast(message, type)` — triggers a toast notification

`ConversationDetailPage` owns per-conversation state:
- `state.detail` — loaded `ConversationDetail` (includes `messages`)
- `state.error` / `state.loadedId` — error and identity tracking
- `retryCount` — incremented to force a retry on the same `id`

### Auth

- Login/register hit the backend directly (`http://localhost:8000/login`, `/register`).
- On success, the response JSON is stored in `localStorage` under key `user`.
- All subsequent API calls read `user.token` from localStorage and send it as `Authorization: Bearer <token>`.
- `ConversationsLayout` guards the route: if `localStorage.user` is missing it redirects to `/login`.

### API Layer (`lib/api.ts`)

`apiFetch` is the base fetch wrapper: injects the auth token, normalises errors into `ApiError` (with `.code` and `.status`). Backend base URL is `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

`api` object methods:

| Method | Endpoint |
|---|---|
| `getConversations()` | `GET /api/conversations` |
| `getConversation(id)` | `GET /api/conversations/:id` |
| `createConversation(body)` | `POST /api/conversations` |
| `sendMessage(id, content)` | `POST /api/conversations/:id/messages` |
| `cancelConversation(id)` | `PATCH /api/conversations/:id/cancel` |
| `streamChat(id, context, apiKey, onChunk)` | `POST /api/conversations/:id/chat` (SSE) |

`streamChat` reads the SSE stream, parses `data: {...}` lines, and calls `onChunk(text)` for each token. Terminates on `[DONE]` or an error event.

### Models & API Keys (`lib/models.ts`)

`MODEL_LIST` defines all supported models across three providers: `anthropic`, `openai`, `google`.

API keys are stored in `localStorage` as `apiKey_<provider>` (e.g. `apiKey_anthropic`). Use the helpers `getApiKey`, `setApiKey`, `removeApiKey`.

`getProviderForModel(model)` maps a model ID to its provider. `getAvailableModels()` filters to models whose provider key is set.

### Types (`types/index.ts`)

Core types: `Conversation`, `ConversationDetail` (extends `Conversation` + `messages`), `Message`, `ConversationStatus`, `MessageRole`.

`getTitle(conversation)` returns `title ?? 'Untitled'`.

### Utilities (`lib/`)

- `errorMessages.ts` — maps `ApiError.code` strings to user-friendly messages via `getFriendlyError`
- `relativeTime.ts` — formats ISO timestamps as relative strings (e.g. "2 min ago")
- `useToast.ts` — `useToast()` hook managing the `toasts` array and `addToast`/`removeToast`

### Path aliases

`@/*` maps to the repo root (e.g. `@/lib/api`, `@/components/ConversationView`, `@/types`).
