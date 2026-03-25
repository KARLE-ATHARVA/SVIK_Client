"use client";

import { motion, useAnimation, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { ASSET_BASE } from "@/lib/constants";
import { fetchFilterTileList, type TileListItem } from "@/lib/filterApi";

type ShowcaseTile = {
  id: string | number;
  name: string;
  image: string;
  subtitle: string;
};

function normalizeSpaceName(rawSpace: string | null | undefined): string {
  const normalized = String(rawSpace ?? "").trim().toLowerCase();

  switch (normalized) {
    case "kitchen":
      return "Kitchen";
    case "living":
    case "living room":
    case "living_room":
      return "Living Room";
    case "bedroom":
      return "Bedroom";
    case "bathroom":
      return "Bathroom";
    default:
      return "Kitchen";
  }
}

function mapTiles(rows: TileListItem[]): ShowcaseTile[] {
  const assetBase = String(ASSET_BASE ?? "https://vyr.svikinfotech.in/assets/").trim();
  const normalizedAssetBase = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;

  return rows.map((item) => {
    const skuCode = String(item.sku_code ?? "").trim();
    const tileName = String(item.sku_name ?? "").trim();
    const size = String(item.size_name ?? "").trim();

    return {
      id: item.tile_id,
      name: tileName || "Product",
      image: `${normalizedAssetBase}media/thumb/${skuCode}.jpg`,
      subtitle: size || "Size unavailable",
    };
  });
}

function ensureTileCount(tiles: ShowcaseTile[], count: number): ShowcaseTile[] {
  if (tiles.length === 0) return [];
  if (tiles.length >= count) return tiles.slice(0, count);

  const expanded: ShowcaseTile[] = [];
  for (let index = 0; index < count; index += 1) {
    const source = tiles[index % tiles.length];
    expanded.push({
      ...source,
      id: `${source.id}-${index}`,
    });
  }
  return expanded;
}

const textVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

export default function ProductShowcase() {
  const controls = useAnimation();
  const [tiles, setTiles] = useState<ShowcaseTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const selectedSpace = normalizeSpaceName(localStorage.getItem("selected_space_type"));

    fetchFilterTileList({
      spaceName: selectedSpace,
      catNames: [],
      appNames: [],
      finishNames: [],
      sizeNames: [],
      colorNames: [],
    })
      .then((rows) => {
        if (!isMounted) return;
        setTiles(ensureTileCount(mapTiles(rows), 12));
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("ProductShowcase fetch error:", error);
        setTiles([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (tiles.length === 0) return;

    controls.start({
      x: ["0%", "-50%"],
      transition: {
        repeat: Infinity,
        duration: 18,
        ease: "linear",
      },
    });
  }, [controls, tiles.length]);

  const carouselTiles = [...tiles, ...tiles];

  return (
    <section id="category" className="pt-5 pb-24 bg-neutral-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-14"
        >
          <h2 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-slate-900 font-serif">
            NEW <br />
            <span className="text-amber-600">ARRIVALS</span>
          </h2>

          <p
            className="text-xl md:text-2xl leading-relaxed text-slate-600 font-medium 
                       max-w-lg md:justify-self-end md:text-right md:mt-10"
          >
            There&apos;s something truly remarkable about our eco-friendly tiles.
            Beyond aesthetics, they&apos;re crafted to elevate spaces with durability,
            elegance, and timeless appeal.
          </p>
        </motion.div>

        <div className="relative overflow-hidden w-full">
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-slate-500 font-medium">Loading products...</p>
            </div>
          ) : tiles.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <p className="text-slate-500 font-medium">No products available right now.</p>
            </div>
          ) : (
            <motion.div
              animate={controls}
              className="flex space-x-8"
              onMouseEnter={() => controls.stop()}
              onMouseLeave={() =>
                controls.start({
                  x: ["0%", "-50%"],
                  transition: {
                    repeat: Infinity,
                    duration: 18,
                    ease: "linear",
                  },
                })
              }
            >
              {carouselTiles.map((tile, index) => (
                <motion.div
                  key={`${tile.id}-${index}`}
                  className="min-w-[280px] flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-full h-80 relative overflow-hidden rounded-xl shadow-2xl mb-4">
                    <Image
                      src={tile.image}
                      alt={tile.name}
                      fill
                      className="object-cover rounded-xl group-hover:scale-110 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                  </div>

                  <h3 className="text-xl font-semibold mb-1 group-hover:text-amber-700 transition">
                    {tile.name}
                  </h3>
                  <p className="text-slate-500 mb-3">{tile.subtitle}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 flex justify-center"
        >
          <Link
            href="/products"
            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 
                       text-white font-semibold rounded-full 
                       shadow-xl transition flex items-center gap-2"
          >
            Show More
            <FiChevronRight size={20} />
          </Link>
        </motion.div>

        <motion.div
          className="text-center mt-12 max-w-4xl mx-auto"
          variants={textVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.p
            variants={textVariants}
            className="text-4xl font-light leading-snug text-slate-900 italic"
          >
            &quot;A successful space is built on the foundation of timeless materials.
            Our curated collection ensures your design vision is not just met,
            but exceeds the test of time.&quot;
          </motion.p>

          <motion.p
            variants={textVariants}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold mt-4 text-amber-700"
          >
            - TIVI Design Philosophy
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
