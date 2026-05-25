# Chat API — Frontend Integration Guide

This document describes the `/chat` endpoint added to the DeepX backend. It covers the request format, streaming response protocol, error handling, and a complete integration example.

---

## Overview

The chat endpoint accepts a conversation context and streams the AI response back in real time using **Server-Sent Events (SSE)**. The backend calls `gemini-3-flash-preview` and saves the completed response to the database automatically — the frontend does not need to save the assistant message separately.

---

## Endpoint

```
POST /api/conversations/:conversation_id/chat
Content-Type: application/json
```

### Path parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `conversation_id` | UUID string | ID of an existing conversation |

### Request body

```json
{
  "api_key": "YOUR_GEMINI_API_KEY",
  "context": [
    { "role": "user",      "content": "What is 2+2?" },
    { "role": "assistant", "content": "Two plus two equals four." },
    { "role": "user",      "content": "Now multiply that by 3." }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `api_key` | string | Yes | Gemini API key. If `GEMINI_API_KEY` is set server-side, that key takes precedence and this field is ignored — but it must still be present in the request body. |
| `context` | array | Yes | Ordered list of all conversation turns, including the new user message as the last item. Must not be empty. |
| `context[].role` | string | Yes | `"user"` or `"assistant"` |
| `context[].content` | string | Yes | The message text |

---

## Response — SSE Stream

The response is a stream with `Content-Type: text/event-stream`. Read it as an event stream — do **not** try to parse it as JSON all at once.

### Event types

**Text chunk** — one or more words from the model, arrives as the model generates:
```
data: {"text": "Two plus two"}

data: {"text": " equals four."}

```

**Stream complete** — sent once after all chunks have been received and the message has been saved to the database:
```
data: [DONE]

```

**Error** — sent if the Gemini API call fails at any point. No message is saved to the database:
```
data: {"error": "400 INVALID_ARGUMENT. API key not valid..."}

```

---

## Pre-stream Error Responses

These are returned as regular JSON (not SSE) when the request itself is invalid, **before** any streaming begins.

### 400 — Missing field
```json
{ "error": { "code": "MISSING_FIELD", "message": "api_key and context are required" } }
```

### 404 — Conversation not found
```json
{ "error": { "code": "CONVERSATION_NOT_FOUND", "message": "No conversation found with id ..." } }
```

---

## Complete Integration Flow

```
1. POST /api/conversations              → create conversation, get conversation_id
2. POST /api/conversations/:id/messages → save user message (role: "user")
3. POST /api/conversations/:id/chat     → stream AI response
4. [backend saves assistant message automatically on stream complete]
5. GET  /api/conversations/:id          → fetch full history (user + assistant messages)
```

---

## JavaScript Integration Example

```js
async function streamChat(conversationId, context, apiKey) {
  const response = await fetch(`/api/conversations/${conversationId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, context }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? 'Request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const payload = line.slice(6).trim();

      if (payload === '[DONE]') {
        // Stream complete — assistant message is now in the DB
        return;
      }

      const event = JSON.parse(payload);

      if (event.error) {
        throw new Error(event.error);
      }

      if (event.text) {
        // Append chunk to your UI
        appendToChat(event.text);
      }
    }
  }
}
```

### Usage

```js
// Build context from your local message state
const context = [
  { role: 'user', content: 'What is 2+2?' },
  { role: 'assistant', content: 'Two plus two equals four.' },
  { role: 'user', content: 'Now multiply that by 3.' },  // the new message
];

await streamChat(conversationId, context, geminiApiKey);

// After [DONE], the assistant turn is in the DB — safe to re-fetch
const updated = await fetch(`/api/conversations/${conversationId}`).then(r => r.json());
```

---

## Notes

- **Model is fixed server-side.** The backend always calls `gemini-3-flash-preview` regardless of the `model` field on the conversation. No model selection is needed from the frontend.
- **The frontend is responsible for sending the full context** on every call — the backend does not reconstruct history from the DB automatically.
- **The assistant message is saved after `[DONE]`** — it is safe to call `GET /api/conversations/:id` once the stream ends to get the complete updated history.
- **On error, nothing is saved.** If `data: {"error": ...}` is received, the failed response is not persisted and the conversation history is unchanged.
- **`api_key` must always be in the request body** even when a server-side key is configured. Send the user's key if you have it; the server will override it silently if its own key is set.
