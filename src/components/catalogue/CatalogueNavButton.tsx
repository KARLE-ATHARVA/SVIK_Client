"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useCatalogueCount } from "@/lib/useCatalogueCount";

type CatalogueNavButtonProps = {
  className?: string;
};

export default function CatalogueNavButton({ className = "" }: CatalogueNavButtonProps) {
  const count = useCatalogueCount();

  return (
    <Link
      href="/catalogue"
      aria-label="Open catalogue"
      title="Catalogue"
      className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/80 ${className}`}
    >
      <BookOpen size={16} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-black">
          {count}
        </span>
      )}
    </Link>
  );
}
