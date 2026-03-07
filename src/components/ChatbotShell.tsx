"use client";

import { useState } from "react";
import { Bot, MessageCircle, SendHorizontal, Sparkles, X } from "lucide-react";

export default function ChatbotShell() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[80]">
        {open ? (
          <section className="absolute bottom-[calc(100%+12px)] right-0 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
            <header className="relative overflow-hidden bg-slate-900 px-5 py-4 text-white">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/25 via-transparent to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-slate-900">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-wide">TiVi Assistant</p>
                    <p className="text-[11px] text-slate-300">Online • Ready to help</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close chatbot"
                >
                  <X size={16} />
                </button>
              </div>
            </header>

            <div className="h-[min(320px,45vh)] space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
              <div className="mr-8 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700">
                Hi, I am your tile assistant. Ask anything about size, finish, color, or visualizer tips.
              </div>

              <div className="ml-12 rounded-2xl rounded-br-md bg-amber-500 px-3.5 py-3 text-sm font-medium text-slate-900">
                I want a warm matte tile for my kitchen wall.
              </div>

              <div className="mr-8 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700">
                Great choice. Chat logic will be integrated here next.
              </div>
            </div>

            <footer className="border-t border-slate-200 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500">
                <Sparkles size={13} className="text-amber-600" />
                <span>Placeholder UI ready for backend + AI integration</span>
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2"
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type your query..."
                  className="h-10 flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500 text-slate-900 transition hover:bg-amber-600"
                  aria-label="Send query"
                >
                  <SendHorizontal size={16} />
                </button>
              </form>
            </footer>
          </section>
        ) : null}
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative grid h-14 w-14 place-items-center rounded-full border border-amber-300/60 bg-slate-900 text-white shadow-[0_12px_30px_-15px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5"
            aria-label="Open chatbot"
          >
            <MessageCircle size={22} className="text-amber-500" />
            <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
              Chat with TiVi
            </span>
          </button>
        ) : null}
      </div>
    </>
  );
}
