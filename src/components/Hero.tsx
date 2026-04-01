"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FiCamera, FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: EASE_OUT,
    },
  },
});

export default function Hero() {
  const router = useRouter();

  return (
    <motion.section
      id="home"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className="relative min-h-[88vh] flex items-center justify-center pt-[50px] pb-6 overflow-hidden"
    >
      {/* BACKGROUND */}
      <motion.div
        initial={{ y: 0, opacity: 0 }}
        animate={{ y: -20, opacity: 1 }}
        transition={{ duration: 3, ease: EASE_OUT }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/hero-room.jpg"
          alt="Luxury Tile Room"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply" />
      </motion.div>

      {/* WALL TILE HOTSPOT */}
      <div className="absolute top-[22%] left-[48%] z-20 flex items-center gap-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 36 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASE_OUT }}
          className="h-[2px] bg-white/50"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, ease: EASE_OUT }}
          className="w-4 h-4 bg-amber-500 rounded-full shadow-lg"
        />
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, ease: EASE_OUT }}
          className="px-4 py-3 bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 text-white shadow-xl"
        >
          <p className="text-sm font-semibold">Wall Tile</p>
          <p className="text-xs opacity-80">₹5,999 / sq.ft</p>
        </motion.div>
      </div>

      {/* FLOOR TILE HOTSPOT */}
      <div className="absolute bottom-[8%] left-[38%] z-20 flex items-center gap-4">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 44 }}
            transition={{ delay: 0.6, duration: 0.4, ease: EASE_OUT }}
            className="w-[2px] bg-white/50"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.85, ease: EASE_OUT }}
            className="w-4 h-4 bg-amber-500 rounded-full shadow-lg"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.05, ease: EASE_OUT }}
          className="px-4 py-3 bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 text-white shadow-xl"
        >
          <p className="text-sm font-semibold">Floor Tile</p>
          <p className="text-xs opacity-80">₹7,499 / sq.ft</p>
        </motion.div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between z-10 translate-y-[-20px]">
        {/* LEFT */}
        <motion.div {...fadeUp(0.2)} className="md:w-1/2 p-4 text-white">
          <p className="text-lg font-semibold uppercase tracking-widest mb-2 text-amber-300">
            New Launch
          </p>

          <h2 className="text-6xl sm:text-7xl font-extrabold leading-tight mb-6">
            LUXURY TILE <br />
            BUILT TO <span className="text-amber-300">LAST</span>
          </h2>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            {...fadeUp(0.5)}
            onClick={() => router.push("/catalogue")}
            className="px-6 py-4 bg-amber-600 text-white text-base font-semibold rounded-full shadow-2xl"
          >
            EXPLORE CATALOG →
          </motion.button>
        </motion.div>

        {/* RIGHT PANEL */}
        <motion.div
          {...fadeUp(0.7)}
          className="hidden md:block bg-slate-900/55 backdrop-blur-md p-8 rounded-2xl shadow-2xl text-white border border-white/10 w-[340px]"
        >
          <div className="space-y-6">
            {[
              { title: "Collections", desc: "Floor & Wall Tiles" },
              { title: "Styles", desc: "Wood, Marble & Outdoor" },
              { title: "Finish", desc: "Matte, Gloss, Textured" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase opacity-60">{item.title}</p>
                  <p className="font-semibold">{item.desc}</p>
                </div>
                <FiPlus className="opacity-60" />
              </div>
            ))}
          </div>

          {/* VISUALIZER BUTTON */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            {...fadeUp(0.9)}
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("visualizer_category_intent");
                sessionStorage.removeItem("visualizer_intent");
                localStorage.removeItem("visualizer_room_id");
                localStorage.removeItem("visualizer_design_hash");
                localStorage.removeItem("visualizer_3d_design_hash");
                localStorage.removeItem("force_3d_mode");
                localStorage.removeItem("selected_3d_sub_scene");
              }
              router.push("/visualizer");
            }}
            className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-amber-600 hover:bg-amber-700 transition rounded-full font-semibold shadow-xl"
          >
            <FiCamera size={20} /> Visualizer
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
}
