"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const Navbar = dynamicImport(() => import("@/components/Navbar"), { ssr: false });
const Hero = dynamicImport(() => import("@/components/Hero"), { ssr: false });
const ProductShowcase = dynamicImport(() => import("@/components/ProductShowcase"), { ssr: false });
const AboutUsFero = dynamicImport(() => import("@/components/AboutUsFero"), { ssr: false });
const Newsletter = dynamicImport(() => import("@/components/Newsletter"), { ssr: false });
const Footer = dynamicImport(() => import("@/components/Footer"), { ssr: false });
const ChatbotShell = dynamicImport(() => import("@/components/ChatbotShell"), { ssr: false });

export default function Home() {
  return (
    <main className="bg-white text-slate-800">
      <Navbar />
      <div className="pt-[64px]">
        <Hero />
        <ProductShowcase />
        <AboutUsFero />
        <Newsletter />
        <Footer />
      </div>
      <ChatbotShell />
    </main>
  );
}
