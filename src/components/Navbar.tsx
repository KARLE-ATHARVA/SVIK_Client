
"use client";

import { useEffect, useState } from "react";
import { LogOut, Search, User } from "lucide-react";
//import CartNavButton from "@/components/cart/CartNavButton";
import AuthModal from "@/components/visualizer/AuthModal";
import { isLoggedIn, logout } from "@/lib/auth";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    setIsUserLoggedIn(isLoggedIn());
  }, []);

  const handleLoginSuccess = () => {
    setIsUserLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleUserClick = () => {
    if (isUserLoggedIn) {
      logout();
      setIsUserLoggedIn(false);
      return;
    }
    setShowAuthModal(true);
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);

    if (section) {
      const navbarHeight = 80;
      const topPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: topPosition,
        behavior: "smooth",
      });
    }

    setOpen(false);
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <nav className="fixed left-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/10 bg-white/5 px-6 py-2 shadow-[0_2px_15px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-300">
        <div className="flex items-center gap-4">
          <button onClick={() => setOpen(true)} className="rounded-full bg-black p-3 text-white shadow-md md:hidden">
            Menu
          </button>

          <div className="ml-2 hidden items-center gap-3 md:flex">
            <button
              onClick={() => scrollToSection("home")}
              className="rounded-full bg-white px-5 py-2 text-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)] transition hover:bg-gray-100"
            >
              Home
            </button>

            <button
              onClick={() => scrollToSection("category")}
              className="rounded-full bg-gray-300 px-5 py-2 text-black shadow transition hover:bg-gray-400"
            >
              Category
            </button>

            <button
              onClick={() => scrollToSection("about")}
              className="rounded-full bg-gray-300 px-5 py-2 text-black shadow transition hover:bg-gray-400"
            >
              About Us
            </button>
          </div>
        </div>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none text-4xl font-extrabold tracking-wide text-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
          TiVi
        </h1>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full bg-gray-800/40 px-4 py-2 text-white shadow-lg backdrop-blur-md md:flex">
            <span className="text-sm">15k Customers</span>
          </div>

          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/80">
            <Search size={16} />
          </button>

          <button
            onClick={handleUserClick}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-black/80"
            title={isUserLoggedIn ? "Logout" : "Login"}
          >
            {isUserLoggedIn ? <LogOut size={16} /> : <User size={16} />}
          </button>

          {/* <CartNavButton /> */}
        </div>
      </nav>

      <div
        className={`fixed left-0 top-0 z-[60] h-full w-64 transform bg-black p-6 text-white transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button onClick={() => setOpen(false)} className="mb-6 text-2xl text-white">
          X
        </button>

        <div className="flex flex-col gap-4 text-lg">
          <button onClick={() => scrollToSection("home")} className="border-b border-white/20 py-2 text-left">
            Home
          </button>

          <button onClick={() => scrollToSection("category")} className="border-b border-white/20 py-2 text-left">
            Category
          </button>

          <button onClick={() => scrollToSection("about")} className="py-2 text-left">
            About Us
          </button>
        </div>
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}