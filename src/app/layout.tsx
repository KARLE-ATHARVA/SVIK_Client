// src/app/layout.tsx
// Server Component – DO NOT add "use client"

import "./globals.css";
import GlobalCartShortcut from "@/components/cart/GlobalCartShortcut";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GlobalCartShortcut />
      </body>
    </html>
  );
}
