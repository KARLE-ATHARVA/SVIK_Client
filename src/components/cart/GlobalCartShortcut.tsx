"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/lib/useCartCount";

export default function GlobalCartShortcut() {
  const pathname = usePathname();
  const { count, ready } = useCartCount();

  if (pathname === "/cart" || pathname === "/") {
    return null;
  }

  return (
    <Link
      href="/cart"
      aria-label="Open cart page"
      className="fixed bottom-5 right-5 z-[70] inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 shadow-[0_14px_30px_-15px_rgba(15,23,42,0.65)] transition hover:bg-slate-50"
    >
      <ShoppingCart size={18} />
      <span>Cart</span>
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-black text-white">{ready ? count : "..."}</span>
    </Link>
  );
}
