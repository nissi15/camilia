import { Warehouse } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Warehouse Portal", href: "/login/warehouse" },
    { label: "Restaurant Portal", href: "/login/restaurant" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="w-full bg-[#050505] text-white border-t border-[#1A1A1A]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-8">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 pb-12 border-b border-white/[0.06]">
          {/* Brand */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#E8532E] flex items-center justify-center">
                <Warehouse className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-heading font-bold text-white/90 tracking-[-0.02em]">
                StockTrace
              </span>
            </div>
            <p className="text-sm text-white/35 max-w-xs leading-relaxed">
              Full supply chain visibility for restaurant chains. Track every
              ingredient from warehouse to table.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="md:col-span-2 space-y-4">
              <h4 className="text-xs font-heading font-semibold text-white/40 uppercase tracking-[0.1em]">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/25 hover:text-white/60 transition-colors duration-300 cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} StockTrace. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-white/15">
            <span>Built with</span>
            <span className="text-white/30 font-medium">21st.dev</span>
            <span>&</span>
            <span className="text-white/30 font-medium">Remotion</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
