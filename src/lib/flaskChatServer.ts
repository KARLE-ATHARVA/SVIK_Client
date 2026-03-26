function normalizeBaseUrl(rawBaseUrl: string) {
  return rawBaseUrl.trim().replace(/\/+$/, "");
}

export function getFlaskChatBaseUrl() {
  const rawBaseUrl =
    process.env.FLASK_API_BASE ||
    process.env.NEXT_PUBLIC_FLASK_API_BASE;

  if (!rawBaseUrl || !rawBaseUrl.trim()) {
    throw new Error("FLASK_API_BASE is not configured.");
  }

  return normalizeBaseUrl(rawBaseUrl);
}
