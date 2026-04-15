"use client";

import { motion, useAnimation, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { API_BASE, ASSET_BASE } from "@/lib/constants";

type ShowcaseTile = {
  id: string | number;
  name: string;
  image: string;
  subtitle: string;
};

type ShowcaseApiRow = {
  tile_id?: string | number;
  sku_name?: string;
  sku_code?: string;
  cat_name?: string;
};

function resolveApiBase(): string {
  const apiBase = String(API_BASE ?? "").trim();
  if (!apiBase) {
    throw new Error("NEXT_PUBLIC_API_BASE is not configured.");
  }
  return apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
}

async function fetchOneTilePerCategory(signal?: AbortSignal): Promise<ShowcaseApiRow[]> {
  const response = await fetch(`${resolveApiBase()}GetOneTilePerGroup?groupBy=category`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `GetOneTilePerGroup failed with status ${response.status}${body ? `: ${body}` : ""}`
    );
  }

  const raw = (await response.json()) as unknown;
  return Array.isArray(raw) ? (raw as ShowcaseApiRow[]) : [];
}

function mapTiles(rows: ShowcaseApiRow[]): ShowcaseTile[] {
  const assetBase = String(ASSET_BASE ?? "").trim();
  const normalizedAssetBase = assetBase.endsWith("/") ? assetBase : `${assetBase}/`;

  return rows.map((item) => {
    const skuCode = String(item.sku_code ?? "").trim();
    const tileName = String(item.sku_name ?? "").trim();
    const categoryName = String(item.cat_name ?? "").trim();

    return {
      id: item.tile_id,
      name: tileName || "Product",
      image: `${normalizedAssetBase}media/thumb/${skuCode}.jpg`,
      subtitle: categoryName || "Category unavailable",
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
  const router = useRouter();
  const [tiles, setTiles] = useState<ShowcaseTile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    fetchOneTilePerCategory(controller.signal)
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
      controller.abort();
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
              className="flex space-x-14"
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
                  <div className="relative flex h-[280px] w-full items-center justify-center mb-4">
                    <Image
                      src={tile.image}
                      alt={tile.name}
                      width={900}
                      height={700}
                      className="max-h-full w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    />
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
          <button
            onClick={() => router.push("/product-catalog")}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 
                       text-white font-semibold rounded-full 
                       shadow-xl transition flex items-center gap-2"
          >
            Show More
            <FiChevronRight size={20} />
          </button>
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
