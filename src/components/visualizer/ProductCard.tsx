"use client";

import { Plus, Heart } from "lucide-react";

type ProductCardProps = {
  product: {
    id: string | number;
    name: string;
    image: string;
    size: string;
  };
  isFavourite: boolean;
  onToggleFavourite: (id: string | number) => void;
};

export default function ProductCard({
  product,
  isFavourite,
  onToggleFavourite
}: ProductCardProps) {
  return (
    <div className="group rounded-3xl bg-white p-3 transition hover:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.15)]">
      
      {/* Image */}
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-linear-to-t from-[#1A2B3C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* ❤️ Favourite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavourite(product.id);
          }}
          className={`absolute top-6 right-6 z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-sm
            opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300
            ${
              isFavourite
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-400 hover:text-red-500"
            }`}
          title="Add to favourites"
        >
          <Heart
            size={16}
            className={isFavourite ? "fill-white" : "fill-transparent hover:fill-red-500"}
          />
        </button>

        {/* Apply Overlay */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center">
          <button className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition bg-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Plus size={14} className="text-amber-500" />
            Apply
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4">
        <h3 className="text-[11px] font-extrabold uppercase leading-tight">
          {product.name}
        </h3>
        <p className="text-[9px] mt-1 uppercase tracking-widest text-slate-400">
          {product.size}
        </p>
      </div>
    </div>
  );
}
