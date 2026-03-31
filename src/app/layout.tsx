// src/app/layout.tsx
// Server Component – DO NOT add "use client"

import "./globals.css";
import { ASSET_BASE, API_BASE, REMOTE_ASSET_BASE } from "@/lib/constants";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicEnv = {
    NEXT_PUBLIC_API_BASE: API_BASE || "",
    NEXT_PUBLIC_ASSET_BASE: ASSET_BASE || REMOTE_ASSET_BASE || "",
    NEXT_PUBLIC_REMOTE_ASSET_BASE: REMOTE_ASSET_BASE || "",
  };

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/app/visualizer/css/font-awesome.min.css" />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: [
              "window.NEXT_PUBLIC_API_BASE = " +
                JSON.stringify(publicEnv.NEXT_PUBLIC_API_BASE) +
                ";",
              "window.NEXT_PUBLIC_ASSET_BASE = " +
                JSON.stringify(publicEnv.NEXT_PUBLIC_ASSET_BASE) +
                ";",
              "window.NEXT_PUBLIC_REMOTE_ASSET_BASE = " +
                JSON.stringify(publicEnv.NEXT_PUBLIC_REMOTE_ASSET_BASE) +
                ";",
            ].join("\n"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
