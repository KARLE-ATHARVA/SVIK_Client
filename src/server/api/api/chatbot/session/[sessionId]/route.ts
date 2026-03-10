import { NextResponse } from "next/server";

import { getFlaskChatBaseUrl } from "@/lib/flaskChatServer";

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { sessionId } = await context.params;

  try {
    const response = await fetch(
      `${getFlaskChatBaseUrl()}/chat/session/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        cache: "no-store",
      },
    );

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reset chatbot session.",
      },
      { status: 502 },
    );
  }
}
