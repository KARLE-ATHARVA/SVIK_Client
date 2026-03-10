export type ChatbotFilters = Record<string, string | null | undefined>;

export type ChatbotFollowup = {
  missing_filter?: string;
  question?: string;
  options?: string[];
};

export type ChatbotResponse = {
  session_id: string;
  query: string;
  filters: ChatbotFilters;
  recommendations: unknown;
  followup?: ChatbotFollowup;
  error?: string;
};

type ChatbotRequest = {
  query: string;
  sessionId: string;
};

const CHATBOT_API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ?? "";

function buildApiUrl(path: string) {
  if (!CHATBOT_API_BASE) {
    return path;
  }

  let normalizedPath = path;
  if (
    CHATBOT_API_BASE.toLowerCase().endsWith("/api") &&
    normalizedPath.toLowerCase().startsWith("/api")
  ) {
    normalizedPath = normalizedPath.slice(4) || "/";
  }

  if (!normalizedPath.startsWith("/")) {
    return `${CHATBOT_API_BASE}/${normalizedPath}`;
  }

  return `${CHATBOT_API_BASE}${normalizedPath}`;
}

function buildErrorMessage(fallback: string, payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const message = payload.error;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function postChatbotQuery({
  query,
  sessionId,
}: ChatbotRequest): Promise<ChatbotResponse> {
  const response = await fetch(buildApiUrl("/api/chatbot"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      session_id: sessionId,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(buildErrorMessage("Unable to reach chatbot service.", payload));
  }

  return payload as ChatbotResponse;
}

export async function clearChatbotSession(sessionId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/chatbot/session/${encodeURIComponent(sessionId)}`),
    {
      method: "DELETE",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(buildErrorMessage("Unable to reset chatbot session.", payload));
  }
}
