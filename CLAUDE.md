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
- **Geist Sans / Geist Mono** loaded via `next/font/google` in `app/layout.tsx`

## Architecture

All UI lives in a single route (`app/page.tsx`) as a `"use client"` component. There are no server components with data fetching yet.

### State

`page.tsx` owns all state:
- `sidebarOpen` — toggles the left sidebar
- `settingsOpen` — mounts/unmounts the `SettingsModal`
- `selectedModel` — active model shown in the input bar
- `activeChat` — highlighted chat history item

### Settings & API keys

`SettingsModal` (defined in `page.tsx`) lets users pick a provider from `["Gemini", "Claude", "OpenAI"]` and save an API key to `localStorage` under the key `apiKey_<Provider>`. On mount it reads all three keys to show a green dot on already-configured providers. This is intentionally localStorage-only for now — the plan is to move storage to a database later.

### Path aliases

`@/*` maps to the repo root (e.g. `@/app/...`, `@/components/...`).
