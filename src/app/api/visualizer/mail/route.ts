import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import https from "https";

function normalizeBase(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}

function getVisualizerMailEndpoints() {
  const explicitEndpoint = process.env.VISUALIZER_MAIL_ENDPOINT;
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
    `${normalized}visualizermail`,
    `${normalized}app/admin/visualizer/mail`,
  ];

  const expanded = [...primary];
  try {
    const parsed = new URL(normalized);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    // In local development many APIs run on HTTP while env uses HTTPS.
    if (isLocal && parsed.protocol === "https:") {
      const httpBase = `http://${parsed.host}${parsed.pathname}`;
      const normalizedHttp = normalizeBase(httpBase);
      expanded.push(
        `${normalizedHttp}visualizermail`,
        `${normalizedHttp}app/admin/visualizer/mail`
      );

      const localIpBase = `https://127.0.0.1:${parsed.port}${parsed.pathname}`;
      const normalizedLocalIp = normalizeBase(localIpBase);
      expanded.push(
        `${normalizedLocalIp}visualizermail`,
        `${normalizedLocalIp}app/admin/visualizer/mail`
      );
    }
  } catch {
    // Keep primary endpoints if base is not parseable as URL.
  }

  return expanded;
}

function stringValue(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const endpoints = getVisualizerMailEndpoints();
  if (!endpoints.length) {
    return NextResponse.json(
      {
        error:
          "Mail endpoint is not configured. Set VISUALIZER_MAIL_ENDPOINT or API_BASE/NEXT_PUBLIC_API_BASE.",
      },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form payload." }, { status: 400 });
  }

  const payload = new URLSearchParams();
  const allowedKeys = [
    "full_name",
    "from",
    "to",
    "subject",
    "message",
    "roomname",
    "tiles",
    "imgpath",
    "design_link",
  ];

  for (const key of allowedKeys) {
    const value = stringValue(form.get(key));
    if (value) {
      payload.set(key, value);
    }
  }

  const to = payload.get("to") || "";
  const subject = payload.get("subject") || "";
  const message = payload.get("message") || "";

  if (!to || !subject || !message) {
    return NextResponse.json(
      { error: "Missing required fields: to, subject, message." },
      { status: 400 }
    );
  }

  if (!isValidEmail(to)) {
    return NextResponse.json(
      { error: "Recipient email address is invalid." },
      { status: 400 }
    );
  }

  let lastStatus = 0;
  let lastDetails = "";

  try {
    for (const endpoint of endpoints) {
      const parsed = new URL(endpoint);
      const isLocalHttps =
        parsed.protocol === "https:" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");

      const upstream = await axios.post(endpoint, payload.toString(), {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
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
      const responseText =
        typeof upstream.data === "string"
          ? upstream.data
          : JSON.stringify(upstream.data ?? "");
      if (upstream.status >= 200 && upstream.status < 300) {
        return NextResponse.json({
          success: true,
          message: "Email sent successfully.",
          upstreamResponse: responseText.slice(0, 300),
          endpoint,
        });
      }

      lastStatus = upstream.status || 0;
      lastDetails = responseText.slice(0, 300);
    }

    return NextResponse.json(
      {
        error: "Upstream visualizer mail endpoint failed.",
        status: lastStatus || 502,
        details: lastDetails,
        attemptedEndpoints: endpoints,
      },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to call upstream visualizer mail endpoint.",
        attemptedEndpoints: endpoints,
        details:
          error instanceof Error ? error.message : "Unknown fetch error",
      },
      { status: 502 }
    );
  }
}
