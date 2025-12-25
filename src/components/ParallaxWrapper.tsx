// src/components/ParallaxWrapper.tsx
"use client"; // <--- ADDED/CONFIRMED

import { motion } from "framer-motion";
import React from "react";

// This component acts as a container for scroll-linked animations
export default function ParallaxWrapper({ children }: { children: React.ReactNode }) {
  // We'll use the default scroll behavior for simplicity,
  // but wrap children in a motion.div for potential child animations
  return (
    <motion.div>
      {children}
    </motion.div>
  );
}