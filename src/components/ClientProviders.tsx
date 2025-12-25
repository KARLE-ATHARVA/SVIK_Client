// src/components/ClientProviders.tsx
"use client";

import { AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ⛔ During prerender, DO NOT render AnimatePresence
  if (!mounted) {
    return <>{children}</>;
  }

  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}
