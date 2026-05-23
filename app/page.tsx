"use client";

import { useState } from "react";

const chatHistory = [
  "I want you to verify NDA from ...",
  "below is the job description, an...",
  "implement RSF function",
  "what is dense vector in RAG",
  "help me setup a simple hello w...",
  "check this link https://arxiv.org/...",
  "can you simplify the abstract an...",
  "hi",
  "do you ability to generate images",
  "hi",
  "help me learn fastapi in the bes...",
  "are you good at coding",
  "Hi gemma",
  "hello",
];

const models = ["gemma3:12b", "llama3:8b", "mistral:7b", "phi3:mini"];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemma3:12b");
  const [activeChat, setActiveChat] = useState<number | null>(null);

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white">
          <div className="flex items-center gap-2 px-3 py-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          </div>

          {/* New Chat */}
          <div className="px-3 pb-1">
            <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Settings */}
          <div className="px-3 pb-3">
            <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto px-3">
            <p className="text-xs text-gray-400 font-medium px-3 py-1 mb-1">Older</p>
            <ul className="space-y-0.5">
              {chatHistory.map((chat, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActiveChat(i)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg truncate transition-colors ${
                      activeChat === i
                        ? "bg-gray-100 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {chat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar (when sidebar is closed) */}
        {!sidebarOpen && (
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Open sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          </div>
        )}

        {/* Center content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* deep-chat branding instead of llama image */}
          <div className="flex flex-col items-center gap-3 mb-16 select-none">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center shadow-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-gray-900">deep-chat</span>
          </div>
        </div>

        {/* Input bar */}
        <div className="px-6 pb-6 flex justify-center">
          <div className="w-full max-w-2xl bg-gray-100 rounded-2xl px-4 py-3 flex items-end gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  setMessage("");
                }
              }}
              placeholder="Send a message"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none resize-none leading-6"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Attach button */}
              <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              {/* Model selector */}
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="appearance-none bg-transparent text-sm text-gray-500 pr-5 outline-none cursor-pointer hover:text-gray-700 transition-colors"
                >
                  {models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400"
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Send button */}
              <button
                onClick={() => setMessage("")}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  message.trim()
                    ? "bg-gray-900 text-white hover:bg-gray-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!message.trim()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
