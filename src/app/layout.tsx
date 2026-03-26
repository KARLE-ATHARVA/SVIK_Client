// src/app/layout.tsx
// Server Component – DO NOT add "use client"

import "./globals.css";
import GlobalCartShortcut from "@/components/cart/GlobalCartShortcut";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicEnv = {
    NEXT_PUBLIC_API_BASE:
      process.env.NEXT_PUBLIC_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "",
    NEXT_PUBLIC_ASSET_BASE:
      process.env.NEXT_PUBLIC_ASSET_BASE ||
      process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
      "",
  };

  return (
    <html lang="en">
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
            ].join("\n"),
          }}
        />
        {children}
        <GlobalCartShortcut />
      </body>
    </html>
  );
}
