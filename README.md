# Deep Chat

A full-stack application for chatting with large language models (LLMs) while capturing, storing, and visualizing inference metadata in real time. Supports Anthropic, OpenAI, and Google AI providers from a single interface.

## Features

- **Multi-provider chat** — switch between Claude, GPT, and Gemini models in any conversation
- **Streaming responses** — real-time token streaming via Server-Sent Events (SSE)
- **Inference logs** — paginated log viewer with filtering by status, model, and conversation
- **Markdown rendering** — assistant responses rendered with full GFM support (tables, code blocks, lists)
- **Per-provider API keys** — keys stored in `localStorage`; no server-side key storage
- **Auth** — JWT-based login/register backed by a separate API server

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Markdown | react-markdown + remark-gfm |
| Language | TypeScript 5 (strict) |
| Auth | JWT via backend API |
| Backend | Separate API server at `http://localhost:8000` |

## Prerequisites

- Node.js 18+
- The backend API server running at `http://localhost:8000` (see backend repo)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # Run ESLint
```

## Configuration

Set the backend URL via environment variable (defaults to `http://localhost:8000`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create a `.env.local` file in the project root to override.

## Project Structure

```
app/
├── layout.tsx                    # Root layout (fonts, global styles)
├── page.tsx                      # Redirects → /conversations
├── login/page.tsx                # Login
├── register/page.tsx             # Registration
└── conversations/
    ├── layout.tsx                # Sidebar shell + ConversationsContext
    ├── page.tsx                  # Empty-state placeholder
    ├── [id]/page.tsx             # Conversation detail & chat
    └── logs/page.tsx             # Inference logs viewer

components/
├── ConversationSidebar.tsx       # Left-rail conversation list
├── ConversationItem.tsx          # Single sidebar row
├── ConversationView.tsx          # Main chat panel
├── MessageBubble.tsx             # Individual message with Markdown support
├── MessageInput.tsx              # Textarea + send button
├── InferenceLogsView.tsx         # Logs table with filters + detail panel
├── NewConversationModal.tsx      # Model/provider picker
├── SettingsModal.tsx             # API key management
├── ConfirmDialog.tsx             # Generic confirmation dialog
├── StatusBadge.tsx               # Conversation status pill
└── Toast.tsx / ToastContainer.tsx

lib/
├── api.ts                        # API client (apiFetch, api.* methods)
├── models.ts                     # Model list, provider helpers, API key utils
├── errorMessages.ts              # ApiError → user-friendly strings
├── relativeTime.ts               # ISO timestamp → "2 min ago"
└── useToast.ts                   # Toast hook

types/index.ts                    # Conversation, Message, InferenceLog, etc.
```

## Supported Models

| Provider | Models |
|---|---|
| Anthropic | Claude Opus 4.7, Claude Sonnet 4.6 / 4.5, Claude Haiku 4.5 |
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo |
| Google | Gemini 2.0 Flash, Gemini 1.5 Pro / Flash |

## API Keys

API keys are stored in browser `localStorage` under `apiKey_<provider>` (e.g. `apiKey_anthropic`). Set them via the settings icon in the sidebar. Keys never leave the browser — they are sent directly to the streaming endpoint alongside your request.

## Authentication

Register or log in at `/register` and `/login`. On success the server returns a JWT stored in `localStorage` under the `user` key. All API calls attach it as `Authorization: Bearer <token>`. The conversations layout redirects unauthenticated users to `/login`.

## Inference Logs

Navigate to `/conversations/logs` to browse all inference events. Filter by:

- **Status** — `success` or `error`
- **Model** — exact model ID
- **Conversation ID** — UUID of the parent conversation

Results are paginated (50 per page). Click any row to expand the full request/response payload.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/)
4. Open a pull request against `main`

## License

MIT
