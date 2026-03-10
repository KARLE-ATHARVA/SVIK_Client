import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";

function normalizeBase(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function getUserActivityEndpoints() {
  const explicitEndpoint = process.env.USER_ACTIVITY_ENDPOINT;
  if (explicitEndpoint && explicitEndpoint.trim()) {
    return [explicitEndpoint.trim()];
  }

  const base =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.BACKEND_API_BASE;

  if (!base || !base.trim()) {
    return [];
  }

  const normalized = normalizeBase(base.trim());
  const primary = [
    `${normalized}AddUserActivity`,
    `${normalized}api/AddUserActivity`,
    `${normalized}UserActivityLog/AddUserActivity`,
    `${normalized}api/UserActivityLog/AddUserActivity`,
  ];
  const expanded = [...primary];

  try {
    const parsed = new URL(normalized);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    // Local backend often runs HTTP even when env base is HTTPS.
    if (isLocal && parsed.protocol === "https:") {
      const httpBase = `http://${parsed.host}${parsed.pathname}`;
      expanded.push(`${normalizeBase(httpBase)}AddUserActivity`);
    }
  } catch {
    // Ignore parse errors; keep primary endpoint.
  }

  return expanded;
}

type UserActivityPayload = {
  source?: string;
  ipAddress?: string;
  url?: string;
  tileId?: number;
  block?: number;
};

export async function POST(req: NextRequest) {
  const endpoints = getUserActivityEndpoints();
  if (!endpoints.length) {
    return NextResponse.json(
      { error: "User activity endpoint is not configured." },
      { status: 500 }
    );
  }

  let body: UserActivityPayload;
  try {
    body = (await req.json()) as UserActivityPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  const source = String(body.source ?? "visualizer_web");
  const ipAddress = String(body.ipAddress ?? clientIp ?? "").trim() || "127.0.0.1";
  const url = String(body.url ?? "");
  const tileId = Number(body.tileId ?? 0);
  const block = Number(body.block ?? 0);

  const payload = {
    source,
    Source: source,
    ipAddress,
    ip_address: ipAddress,
    IpAddress: ipAddress,
    url,
    Url: url,
    tileId,
    tile_id: tileId,
    TileId: tileId,
    block,
    Block: block,
  };

  let lastStatus = 0;
  let lastDetails = "";

  try {
    for (const endpoint of endpoints) {
      const parsed = new URL(endpoint);
      const isLocalHttps =
        parsed.protocol === "https:" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

      const upstream = await axios.post(endpoint, payload, {
        headers: { "content-type": "application/json" },
        timeout: 15000,
        validateStatus: () => true,
        ...(process.env.NODE_ENV !== "production" && isLocalHttps
          ? {
              httpsAgent: new https.Agent({
                rejectUnauthorized: false,
              }),
            }
          : {}),
      });

      if (upstream.status >= 200 && upstream.status < 300) {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      lastStatus = upstream.status || 0;
      lastDetails =
        typeof upstream.data === "string"
          ? upstream.data.slice(0, 300)
          : JSON.stringify(upstream.data ?? "").slice(0, 300);
    }

    return NextResponse.json(
      {
        error: "Upstream AddUserActivity failed.",
        status: lastStatus || 502,
        details: lastDetails,
      },
      { status: lastStatus || 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to call upstream AddUserActivity endpoint.",
        details:
          error instanceof Error ? error.message : "Unknown upstream error",
      },
      { status: 502 }
    );
  }
}
