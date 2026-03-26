import { NextRequest, NextResponse } from "next/server";
import * as QRCode from "qrcode";

export const runtime = "nodejs";

const DEFAULT_SIZE = 220;
const MAX_SIZE = 600;

function parseSize(raw: string | null): number {
  if (!raw) return DEFAULT_SIZE;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_SIZE;
  const clamped = Math.max(80, Math.min(MAX_SIZE, Math.floor(parsed)));
  return clamped || DEFAULT_SIZE;
}

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const size = parseSize(req.nextUrl.searchParams.get("size"));

  try {
    const buffer = await QRCode.toBuffer(data, {
      width: size,
      margin: 0,
      errorCorrectionLevel: "M",
      type: "png",
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
