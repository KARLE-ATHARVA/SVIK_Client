"use client";

import {
  motion,
  useAnimation,
  type Variants,
} from "framer-motion";
import { useEffect } from "react";
import Image from "next/image";
import { FiChevronRight } from "react-icons/fi";

// --------------------
// Data
// --------------------

const newTiles = [
  { name: "Terra Cotta Glaze", price: "₹7,499", image: "/tile-1.jpg" },
  { name: "Subtle Grey Mosaic", price: "₹9,999", image: "/tile-2.jpg" },
  { name: "Rustic Wood Plank", price: "₹6,299", image: "/tile-3.jpg" },
  { name: "Modern White Hexagon", price: "₹8,299", image: "/tile-4.jpg" },
  { name: "Coastal Blue Ceramic", price: "₹7,999", image: "/tile-5.jpg" },
  { name: "Polished Onyx Look", price: "₹12,499", image: "/tile-6.jpg" },
];

// --------------------
// Framer Motion Variants (TYPE-SAFE)
// --------------------

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

// --------------------
// Component
// --------------------

export default function ProductShowcase() {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      x: ["0%", "-50%"],
      transition: {
        repeat: Infinity,
        duration: 18,
        ease: "linear",
      },
    });
  }, [controls]);

  return (
    <section className="pt-5 pb-24 bg-neutral-50">
      <div className="container mx-auto px-6">

        {/* ================= HEADER ================= */}
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
            There’s something truly remarkable about our eco-friendly tiles.
            Beyond aesthetics, they’re crafted to elevate spaces with durability,
            elegance, and timeless appeal.
          </p>
        </motion.div>

        {/* ================= AUTO CAROUSEL ================= */}
        <div className="relative overflow-hidden w-full">
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
            {[...newTiles, ...newTiles].map((tile, index) => (
              <motion.div
                key={index}
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
                <p className="text-slate-500 mb-3">{tile.price}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ================= SHOW MORE ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-10 flex justify-center"
        >
          <button
            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 
                       text-white font-semibold rounded-full 
                       shadow-xl transition flex items-center gap-2"
          >
            Show More
            <FiChevronRight size={20} />
          </button>
        </motion.div>

        {/* ================= TEXT BLOCK ================= */}
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
            “A successful space is built on the foundation of timeless materials.
            Our curated collection ensures your design vision is not just met,
            but exceeds the test of time.”
          </motion.p>

          <motion.p
            variants={textVariants}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold mt-4 text-amber-700"
          >
            — TIVI Design Philosophy
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
