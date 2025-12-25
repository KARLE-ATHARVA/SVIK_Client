"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

// --- Data for the Sections ---

const missionContent = {
  headingPart1: "ABOUT ",
  headingPart2: "US.",
  description: [
    "There's an undeniable beauty in our responsible and environmentally-friendly approach to materials, ensuring that our impact makes a positive contribution to both your space and the planet.",
    "We craft pieces rooted from eco-conscious materials, and we embrace the elegance of sustainable production, which results in furniture that's not just stunning, but ethically sound.",
  ],
  image1: "/hero-room.jpg",
  image2: "/hero-room.jpg",
};

// --- Framer Motion Variants (FIXED & TYPE-SAFE) ---

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const textVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

// --- Component Implementation ---

export default function AboutUsFero() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  return (
    <section
      ref={ref}
      className="bg-white text-slate-900 container mx-auto px-6 py-6 md:py-10 overflow-hidden"
    >
      <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center">
        {/* LEFT: Overlapping Images */}
        <div className="md:w-1/2 relative h-[450px] md:h-[550px] w-full">
          <motion.div
            style={{ y: y1 }}
            initial={{ opacity: 0, x: -100, rotate: -3 }}
            whileInView={{ opacity: 1, x: 0, rotate: -3 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-[80%] h-[80%] z-10 shadow-2xl overflow-hidden rounded-xl"
          >
            <Image
              src={missionContent.image1}
              alt="Modern Interior Design Image 1"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>

          <motion.div
            style={{ y: y2 }}
            initial={{ opacity: 0, x: 100, rotate: 3 }}
            whileInView={{ opacity: 1, x: 0, rotate: 3 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            className="absolute bottom-0 right-0 w-[80%] h-[80%] z-20 shadow-2xl overflow-hidden rounded-xl"
          >
            <Image
              src={missionContent.image2}
              alt="Modern Interior Design Image 2"
              fill
              className="object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
        </div>

        {/* RIGHT: Text Content */}
        <div className="md:w-1/2 md:p-0">
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold mb-6 font-serif tracking-tight"
          >
            {missionContent.headingPart1}
            <span className="text-amber-600">
              {missionContent.headingPart2}
            </span>
          </motion.h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="space-y-6 text-xl text-slate-600"
          >
            {missionContent.description.map((p, index) => (
              <motion.p key={index} variants={textVariants}>
                {p}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
