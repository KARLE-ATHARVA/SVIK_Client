"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/lib/useCartCount";

type CartNavButtonProps = {
  className?: string;
};

export default function CartNavButton({ className = "" }: CartNavButtonProps) {
  const { count } = useCartCount();

  return (
    <Link
      href="/cart"
      aria-label="Open cart"
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/80 ${className}`}
    >
      <ShoppingCart size={18} />
      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-400 px-1 text-center text-[10px] font-black leading-5 text-black">
        {count}
      </span>
    </Link>
  );
}
