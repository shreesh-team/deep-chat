# Plan: Registration & Login Pages

## Goal
Add auth flow: unauthenticated users are redirected to `/login`, can register at `/register`, and land on the deep-chat home after login.

---

## Files to Create / Modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `app/login/page.tsx` | Login form → POST /login → redirect to `/` |
| Create | `app/register/page.tsx` | Register form → POST /register → redirect to `/login` |
| Modify | `app/page.tsx` | Auth guard: no session → redirect to `/login` |

---

## Session Storage

- After a successful login, store the response object (`{ id, name, email, created_at }`) in `localStorage` under key `"user"`.
- The home page reads `localStorage.getItem("user")` on mount; if absent, calls `router.replace("/login")`.
- No server-side session / cookies for now — localStorage only, consistent with the existing `apiKey_*` pattern.

---

## Step-by-Step Implementation

### 1. `app/register/page.tsx`

**State**: `name`, `email`, `password`, `errors` (field-level), `apiError` (server error string), `loading`.

**Validation** (run before fetch):
- `name`: non-empty
- `email`: non-empty + matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- `password`: non-empty, minimum 6 characters

**On submit**:
1. Run validation; abort if any field invalid.
2. `fetch("http://localhost:8000/register", { method: "POST", body: JSON.stringify({ name, email, password }) })`.
3. Non-2xx response → parse error body if possible, set `apiError`.
4. Network failure → set `apiError` to a generic message.
5. Success → `router.push("/login")`.

**UI elements**:
- Card centered on screen matching the app's gray/white palette.
- Inline field-level error messages beneath each input.
- Single `apiError` banner above the submit button.
- Submit button disabled + shows "Registering…" while `loading`.
- "Already have an account? Log in" link → `/login`.

---

### 2. `app/login/page.tsx`

**State**: `email`, `password`, `errors`, `apiError`, `loading`.

**Validation**:
- `email`: non-empty + valid email format
- `password`: non-empty

**On submit**:
1. Validate; abort if invalid.
2. `fetch("http://localhost:8000/login", { method: "POST", body: JSON.stringify({ email, password }) })`.
3. Non-2xx → set `apiError`.
4. Network failure → set `apiError`.
5. Success → `localStorage.setItem("user", JSON.stringify(data))` → `router.push("/")`.

**UI elements**:
- Same card style as register page.
- Inline errors + API error banner.
- Submit button disabled + "Logging in…" while loading.
- "Don't have an account? Register" link → `/register`.

---

### 3. `app/page.tsx` — Auth Guard

Add a `useEffect` at the top of the `Home` component:

```ts
useEffect(() => {
  if (!localStorage.getItem("user")) {
    router.replace("/login");
  }
}, []);
```

Import `useRouter` from `"next/navigation"`.

No other changes to the home page.

---

## Validation Rules Summary

| Field | Rule |
|-------|------|
| name | Required, non-empty after trim |
| email | Required, matches email regex |
| password (register) | Required, min 6 chars |
| password (login) | Required, non-empty |

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Validation fails | Inline message under each field, no fetch fired |
| Network error (fetch throws) | `apiError` banner: "Network error. Please try again." |
| 4xx from API | `apiError` banner: API message if available, else "Invalid credentials." / "Registration failed." |
| 5xx from API | `apiError` banner: "Server error. Please try again later." |
| Loading state | Button disabled, label changes |

---

## Styling

Match existing app palette:
- Background: `bg-white` page, `bg-gray-50` card or centered container
- Inputs: same style as `SettingsModal` (`bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5`)
- Primary button: `bg-gray-900 text-white hover:bg-gray-700 rounded-xl`
- Error text: `text-red-500 text-xs`
- Links: `text-gray-500 hover:text-gray-900 underline`

---

## Out of Scope

- Logout button (not in spec)
- Token-based auth / JWT (API returns user object, not a token)
- Persistent server-side session
