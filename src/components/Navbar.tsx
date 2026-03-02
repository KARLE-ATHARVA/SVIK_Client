"use client";

import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // 🔥 Smooth scroll function with navbar offset fix
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);

    if (section) {
      const navbarHeight = 80; // adjust if needed
      const topPosition =
        section.getBoundingClientRect().top +
        window.pageYOffset -
        navbarHeight;

      window.scrollTo({
        top: topPosition,
        behavior: "smooth",
      });
    }

    setOpen(false);
  };

  return (
    <>
      {/* BACKDROP */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-2 flex items-center justify-between bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.08)] transition-all duration-300">
        
        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">
          {/* HAMBURGER (MOBILE) */}
          <button
            onClick={() => setOpen(true)}
            className="p-3 bg-black text-white rounded-full shadow-md md:hidden"
          >
            ☰
          </button>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            
            <button
              onClick={() => scrollToSection("home")}
              className="px-5 py-2 bg-white text-black rounded-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] hover:bg-gray-100 transition"
            >
              Home
            </button>

            <button
              onClick={() => scrollToSection("category")}
              className="px-5 py-2 bg-gray-300 text-black rounded-full shadow hover:bg-gray-400 transition"
            >
              Category
            </button>

            <button
              onClick={() => scrollToSection("about")}
              className="px-5 py-2 bg-gray-300 text-black rounded-full shadow hover:bg-gray-400 transition"
            >
              About Us
            </button>

          </div>
        </div>

        {/* CENTER LOGO */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-4xl font-extrabold tracking-wide text-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] select-none">
          TiVi
        </h1>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          
          {/* CUSTOMER BADGE */}
          <div className="hidden md:flex items-center gap-2 bg-gray-800/40 text-white px-4 py-2 rounded-full backdrop-blur-md shadow-lg">
            <span className="text-sm">15k Customers</span>
          </div>

          {/* SEARCH */}
          <button className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-black/80 transition text-white">
            🔍
          </button>

          {/* USER */}
          <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-black/80 transition">
            👤
          </button>
        </div>
      </nav>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-black text-white z-[60] p-6 transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="text-white text-2xl mb-6"
        >
          ✕
        </button>

        <div className="flex flex-col gap-4 text-lg">
          
          <button
            onClick={() => scrollToSection("home")}
            className="text-left py-2 border-b border-white/20"
          >
            Home
          </button>

          <button
            onClick={() => scrollToSection("category")}
            className="text-left py-2 border-b border-white/20"
          >
            Category
          </button>

          <button
            onClick={() => scrollToSection("about")}
            className="text-left py-2"
          >
            About Us
          </button>

        </div>
      </div>
    </>
  );
}
