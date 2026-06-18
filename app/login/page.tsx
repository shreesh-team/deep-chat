"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(email)) {
      e.email = "Enter a valid email address.";
    }
    if (!password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        let message = "Invalid credentials. Please try again.";
        try {
          const data = await res.json();
          if (data?.message || data?.detail) message = data.message ?? data.detail;
        } catch { /* ignore parse errors */ }
        if (res.status >= 500) message = "Server error. Please try again later.";
        setApiError(message);
        return;
      }
      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-xl font-semibold tracking-tight text-gray-900">deep-chat</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-7">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to continue to deep-chat.</p>

          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }}
                placeholder="you@example.com"
                className={`w-full text-sm bg-gray-50 border rounded-xl px-4 py-2.5 outline-none transition-colors placeholder-gray-400 text-gray-800 focus:bg-white ${
                  errors.email ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-gray-400"
                }`}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }}
                placeholder="Your password"
                className={`w-full text-sm bg-gray-50 border rounded-xl px-4 py-2.5 outline-none transition-colors placeholder-gray-400 text-gray-800 focus:bg-white ${
                  errors.password ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-gray-400"
                }`}
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-gray-900 font-medium hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
