# Plan: LLM Connection — Frontend Integration

## Context

The backend has a `POST /api/conversations/:id/chat` endpoint (documented in `.claude/specs/03-llm-connection.md`) that accepts a conversation context and streams the AI response via SSE. The frontend currently saves user messages to the DB (`api.sendMessage`) but never calls the chat endpoint — so no AI responses appear. This plan wires the streaming endpoint into the existing send flow.

---

## What changes

### 1. `lib/api.ts` — Add `streamChat`

Add a new method to the existing `api` object:

```typescript
streamChat(
  conversationId: string,
  context: Array<{ role: 'user' | 'assistant'; content: string }>,
  apiKey: string,
  onChunk: (text: string) => void,
): Promise<void>
```

- Reuses same auth-token logic as `apiFetch` (reads `localStorage.user.token`)
- POST to `BASE_URL/api/conversations/${conversationId}/chat`
- Body: `{ api_key: apiKey, context }`
- Reads response as SSE line-by-line (same buffered-reader loop as the spec's JS example)
- `data: {"text": "..."}` → calls `onChunk(text)`
- `data: [DONE]` → resolves the promise
- `data: {"error": "..."}` → throws `ApiError('STREAM_ERROR', error, 0)`
- Pre-stream non-OK HTTP response → throws `ApiError` from parsed JSON body

### 2. `components/ConversationView.tsx` — Update `handleSend`

Replace the current 3-step flow with a 6-step streaming flow:

```
1. Show optimistic user message (unchanged)
2. api.sendMessage() → persist user message, get `saved`
3. onUpdate({ messages: [...detail.messages, saved] })  ← commit user turn to local state
4. setOptimisticMessages([streamingAssistant])           ← empty assistant bubble
5. api.streamChat(id, context, apiKey, onChunk)          ← fill bubble as chunks arrive
6. api.getConversation(id) → clear optimistic, onUpdate(messages), onRefreshList()
```

- Context array built from `[...detail.messages, saved]`, filtering to `role === 'user' | 'assistant'`
- API key: `getApiKey('google')` from `lib/models.ts` (Gemini key); send `''` if absent — server may have its own key; stream error surfaces as a toast if it fails
- `setSending` stays `true` for the full duration (user save + stream); `finally` resets it
- `setOptimisticMessages` updater maps by temp ID to append each chunk to the right bubble

---

## Files to modify

| File | Change |
|------|--------|
| `lib/api.ts` | Add `streamChat` method to the `api` object |
| `components/ConversationView.tsx` | Update `handleSend`; import `getApiKey` from `lib/models` |

No new files needed.

---

## Error handling

| Scenario | Handling |
|----------|----------|
| No API key + no server key | SSE carries `{"error": "API key not valid"}` → toast |
| Network failure pre-stream | `ApiError('NETWORK_ERROR')` → toast |
| SSE error mid-stream | `ApiError('STREAM_ERROR', ...)` → toast; optimistic cleared |
| `sendMessage` fails | Existing error path unchanged |

---

## Verification

1. `npm run dev` — open a conversation, send a message
2. Optimistic user message appears immediately
3. Empty assistant bubble appears, text streams in progressively
4. On `[DONE]`, bubble replaced by the DB-saved message (re-fetch confirms persistence)
5. Hard-refresh the page — both user and assistant messages load from DB
6. Test with missing/invalid API key — error toast, no broken state
