// src/components/Newsletter.tsx
"use client";

import { motion } from "framer-motion";

export default function Newsletter() {
  const socialImages = [
    "/insta-1.jpg", "/insta-2.jpg", "/insta-3.jpg", "/insta-4.jpg",
  ];

  return (
    <section className="py-5 bg-white">
      <div className="container mx-auto px-6 flex flex-col md:flex-row gap-12">
        {/* LEFT: NEWSLETTER SIGNUP */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="md:w-1/2 bg-neutral-50 p-10 rounded-xl shadow-lg"
        >
          <h3 className="text-4xl font-extrabold mb-4 text-slate-800">
            JOIN OUR DESIGNER NEWSLETTER
          </h3>
          <p className="text-slate-500 mb-6">
            Get exclusive previews of new collections and professional installation guides.
          </p>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="design@yourhome.com"
              className="flex-grow p-3 border border-neutral-300 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-700"
            />
            <button className="px-6 py-3 bg-amber-700 text-white font-semibold rounded-full hover:bg-amber-800 transition">
              SUBSCRIBE
            </button>
          </div>
        </motion.div>

        {/* RIGHT: INSTAGRAM FEED */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="md:w-1/2"
        >
          <h3 className="text-3xl font-extrabold mb-6 text-center md:text-left text-slate-800">
            INSTAGRAM <span className="text-amber-700">@TIVI.TILES</span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {socialImages.map((src, index) => (
              <div key={index} className="aspect-square relative overflow-hidden rounded-lg shadow-md">
                 
                <div className="absolute inset-0 bg-slate-900/20 hover:bg-transparent transition duration-300 cursor-pointer"></div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}