// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const footerLinks = [
    { title: "Company", links: ["About", "Trade Program", "Press"] },
    { title: "Service", links: ["FAQ", "Shipping", "Contact Us"] },
    { title: "Product", links: ["Inspiration", "Care Guides", "3D Design"] },
  ];

  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-white/10 pb-10 mb-10">
          {/* Logo/Brand Section */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-wide text-white select-none mb-4">
              TiVi
            </h1>
            <p className="text-sm text-slate-400 max-w-xs">
              Designing the future one surface at a time. Premium tiles for every space.
            </p>
          </div>

          {/* Link Sections */}
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-bold mb-4">{section.title}</h4>
              <ul className="space-y-2 text-slate-400">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href="#" className="hover:text-amber-400 transition">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social/Contact Section */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contact & Social</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Email: info@tivi.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li className="flex gap-4 text-2xl mt-4 text-amber-500">
                {/* Social Icons Placeholder */}
                <i className="hover:text-amber-400 transition">FB</i>
                <i className="hover:text-amber-400 transition">IG</i>
                <i className="hover:text-amber-400 transition">LN</i>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} TiVi Tiles. All rights reserved. Internship Project.
        </div>
      </div>
    </footer>
  );
}