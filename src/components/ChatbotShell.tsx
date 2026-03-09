"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  LoaderCircle,
  MessageCircle,
  RefreshCcw,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import {
  clearChatbotSession,
  postChatbotQuery,
  type ChatbotFilters,
  type ChatbotFollowup,
  type ChatbotResponse,
} from "@/lib/chatbotApi";

type ChatRole = "assistant" | "user";

type RecommendationCard = {
  id: string;
  title: string;
  skuCode?: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  filters?: ChatbotFilters;
  followup?: ChatbotFollowup;
  recommendations?: RecommendationCard[];
  recommendationCount?: number;
  isError?: boolean;
};

const STORAGE_KEY = "tivi-chat-session-id";
const QUICK_PROMPTS = [
  "Need matte beige wall tiles for kitchen.",
  "Show glossy white floor tiles for bathroom.",
  "Suggest warm neutral wall tiles.",
];

const CHATBOT_WIDTH = "w-[min(94vw,380px)] sm:w-[380px]";

function getAssetBase() {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE || "https://vyr.svikinfotech.in/assets/";
  return base.endsWith("/") ? base : `${base}/`;
}

function buildProductHref(skuCode?: string) {
  if (!skuCode?.trim()) {
    return undefined;
  }

  return `/product-details/${encodeURIComponent(skuCode.trim())}`;
}

function buildTileThumbnailFromSku(skuCode?: string) {
  if (!skuCode?.trim()) {
    return undefined;
  }

  const assetBase = getAssetBase();
  return `${assetBase}media/big/${encodeURIComponent(skuCode.trim())}.jpg`;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tivi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function prettifyLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTrimmedStringField(record: Record<string, unknown>, key?: string) {
  if (!key) {
    return undefined;
  }

  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeFilterEntries(filters?: ChatbotFilters) {
  if (!filters) {
    return [];
  }

  return Object.entries(filters)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => ({
      key,
      label: prettifyLabel(key),
      value: String(value).trim(),
    }));
}

function extractRecommendationCards(input: unknown, depth = 0): RecommendationCard[] {
  if (depth > 4 || input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => extractRecommendationCards(item, depth + 1));
  }

  if (!isRecord(input)) {
    return [];
  }

  const titleKeys = [
    "title",
    "name",
    "tile_name",
    "tileName",
    "product_name",
    "productName",
    "design_name",
    "designName",
  ];
  const imageKeys = [
    "image",
    "image_url",
    "imageUrl",
    "img",
    "imgpath",
    "thumbnail",
    "thumbnail_url",
    "thumbnailUrl",
  ];
  const skuKeys = ["sku_code", "skuCode", "code", "sku"];
  const nameKeys = ["sku_name", "skuName"];

  const title = titleKeys.find((key) => typeof input[key] === "string" && String(input[key]).trim());
  const image = imageKeys.find((key) => typeof input[key] === "string" && String(input[key]).trim());
  const skuKey = skuKeys.find((key) => typeof input[key] === "string" && String(input[key]).trim());
  const nameKey = nameKeys.find((key) => typeof input[key] === "string" && String(input[key]).trim());
  const skuCode = getTrimmedStringField(input, skuKey);
  const titleValue =
    getTrimmedStringField(input, title) ??
    getTrimmedStringField(input, nameKey) ??
    skuCode;
  const subtitleParts = ["size", "finish", "color", "application", "category"]
    .map((key) => input[key])
    .filter((value): value is string => typeof value === "string" && value.trim() !== "");

  const cards: RecommendationCard[] = [];

  if (titleValue) {
    const idValue =
      input.id ?? input.tile_id ?? input.tileId ?? skuCode ?? input.sku ?? input.code ?? input.slug ?? titleValue;

    cards.push({
      id: String(idValue),
      title: titleValue,
      skuCode,
      subtitle: subtitleParts.length ? subtitleParts.join(" / ") : undefined,
      imageUrl: getTrimmedStringField(input, image) ?? buildTileThumbnailFromSku(skuCode),
      href: buildProductHref(skuCode),
    });
  }

  return [
    ...cards,
    ...Object.values(input).flatMap((value) => extractRecommendationCards(value, depth + 1)),
  ];
}

function dedupeRecommendationCards(cards: RecommendationCard[]) {
  const seen = new Set<string>();

  return cards.filter((card) => {
    const key = `${card.id}:${card.title}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildAssistantMessage(response: ChatbotResponse): ChatMessage {
  const filters = normalizeFilterEntries(response.filters);
  const recommendations = dedupeRecommendationCards(
    extractRecommendationCards(response.recommendations),
  );
  const followupQuestion = response.followup?.question?.trim();

  const contentParts = [
    recommendations.length
      ? `Here are ${recommendations.length} tile options that match what you asked for.`
      : filters.length
        ? "I updated your preferences."
        : "Tell me a bit more about the tile you want.",
    followupQuestion,
  ].filter(Boolean);

  return {
    id: `${response.session_id}-${Date.now()}`,
    role: "assistant",
    content: contentParts.join(" "),
    filters: response.filters,
    followup: response.followup,
    recommendations: recommendations.slice(0, 3),
    recommendationCount: recommendations.length,
  };
}

function AssistantMessageBubble({ message, onOptionSelect }: {
  message: ChatMessage;
  onOptionSelect: (option: string) => void;
}) {
  const filters = normalizeFilterEntries(message.filters);
  const followupOptions = message.followup?.options?.filter((option) => option.trim()) ?? [];

  return (
    <div className="mr-12 rounded-[24px] rounded-tl-md border border-white/60 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <p className={message.isError ? "text-rose-600" : ""}>{message.content}</p>

      {filters.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <span
              key={filter.key}
              className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900"
            >
              {filter.label}: {filter.value}
            </span>
          ))}
        </div>
      ) : null}

      {message.recommendations?.length ? (
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>Recommended Tiles</span>
            <span>{message.recommendationCount}</span>
          </div>
          <div className="space-y-2">
            {message.recommendations.map((recommendation) => {
              const cardBody = (
                <>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    {recommendation.imageUrl ? (
                      <img
                        src={recommendation.imageUrl}
                        alt={recommendation.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-50 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Tile
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{recommendation.title}</p>
                    {recommendation.skuCode ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {recommendation.skuCode}
                      </p>
                    ) : null}
                    {recommendation.subtitle ? (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{recommendation.subtitle}</p>
                    ) : null}
                  </div>
                </>
              );

              if (recommendation.href) {
                return (
                  <Link
                    key={recommendation.id}
                    href={recommendation.href}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 transition hover:border-amber-300 hover:bg-amber-50/60"
                  >
                    {cardBody}
                  </Link>
                );
              }

              return (
                <article
                  key={recommendation.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
                >
                  {cardBody}
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {message.followup?.question ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Next Question
          </p>
          <p className="mt-1 text-sm text-slate-700">{message.followup.question}</p>
        </div>
      ) : null}

      {followupOptions.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {followupOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onOptionSelect(option)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-slate-900"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ChatbotShell() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(STORAGE_KEY) || createSessionId();
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    const node = bodyRef.current;

    if (!node) {
      return;
    }

    node.scrollTo({
      top: node.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  const activeFilters = useMemo(() => {
    const lastAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");

    return normalizeFilterEntries(lastAssistantMessage?.filters);
  }, [messages]);

  async function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || !sessionId || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage,
    };

    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    setQuery("");

    try {
      const response = await postChatbotQuery({
        query: trimmedMessage,
        sessionId,
      });

      setMessages((current) => [...current, buildAssistantMessage(response)]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The chatbot service is unavailable right now.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function resetConversation() {
    if (!sessionId || resetting) {
      return;
    }

    setResetting(true);

    try {
      await clearChatbotSession(sessionId);
      setMessages([]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-reset-error-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Unable to clear the current session.",
          isError: true,
        },
      ]);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90] sm:bottom-6 sm:right-6">
      {open ? (
        <section className={`absolute bottom-[calc(100%+14px)] right-0 flex h-[min(76vh,680px)] ${CHATBOT_WIDTH} flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-34px_rgba(15,23,42,0.45)]`}>
          <header className="border-b border-slate-200 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-amber-400">
                  <Bot size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
                    TiVi Assistant
                  </p>
                  <h2 className="mt-0.5 text-[15px] font-bold leading-tight text-slate-900">
                    Find the right tile
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Online now</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close chatbot"
              >
                <X size={18} />
              </button>
            </div>

            {activeFilters.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter.key}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-900"
                  >
                    {filter.label}: {filter.value}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div
            ref={bodyRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] px-3 py-3"
          >
            {!messages.length ? (
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="bg-[linear-gradient(135deg,#fff7e6_0%,#ffffff_100%)] px-4 py-4">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
                    <Sparkles size={14} />
                    <span>Quick help</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Tell me where you want to use the tile, the color you like, and whether you want matte or glossy.
                  </p>
                </div>
                <div className="grid gap-2 px-4 py-4">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) =>
              message.role === "assistant" ? (
                <AssistantMessageBubble
                  key={message.id}
                  message={message}
                  onOptionSelect={sendMessage}
                />
              ) : (
                <div
                  key={message.id}
                  className="ml-10 rounded-[22px] rounded-br-md bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.45)]"
                >
                  {message.content}
                </div>
              ),
            )}

            {loading ? (
              <div className="mr-12 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                <LoaderCircle size={16} className="animate-spin text-amber-600" />
                <span>Finding matching tiles...</span>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white px-3 py-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Ask naturally
              </p>
              <button
                type="button"
                onClick={resetConversation}
                disabled={resetting || loading || !messages.length}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw size={13} className={resetting ? "animate-spin" : ""} />
                <span>Reset</span>
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(query);
              }}
              className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-2"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Type your tile requirement..."
                  rows={1}
                  className="max-h-28 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim() || !sessionId}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  aria-label="Send query"
                >
                  <SendHorizontal size={18} />
                </button>
              </div>
            </form>
          </footer>
        </section>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex h-14 items-center gap-3 rounded-full border border-amber-300/60 bg-slate-900 pl-3.5 pr-4 text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.85)] transition hover:-translate-y-0.5"
          aria-label="Open chatbot"
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.28),transparent_55%)]" />
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-amber-500 text-slate-900">
            <MessageCircle size={18} />
          </span>
          <span className="relative hidden text-left sm:block">
            <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
              Ask TiVi
            </span>
            <span className="block text-sm font-semibold text-white">
              Find the right tile faster
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
