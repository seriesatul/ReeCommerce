"use client";

import { motion } from "framer-motion";
import { Sparkles, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const FOOTER_LINKS = {
  Shop: ["Trending Reels", "New Arrivals", "Best Sellers", "Categories", "Verified Sellers"],
  Explore: ["How It Works", "For Sellers", "Blog", "Press Kit", "Careers"],
  Support: ["Help Center", "Contact Us", "Returns Policy", "Privacy Policy", "Terms of Service"],
};

const SOCIALS = [
  { icon: Twitter, label: "Twitter" },
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Youtube, label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-[#040609] border-t border-white/[0.04] pt-20 pb-10">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span
                className="text-white font-black text-2xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Re<span className="text-emerald-400 italic font-light">commerce</span>
              </span>
            </a>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-8">
              The world's first video-first commerce platform. See it, feel it, buy it — with total confidence.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-bold text-sm mb-5 tracking-wide">{category}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 hover:text-white text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">
            © 2025 Recommerce. All rights reserved. Made with immersion.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white/25 text-xs">All systems operational</span>
          </div>
        </div>

        {/* Giant Logo */}
        <div className="mt-8 overflow-hidden">
          <p
            className="text-[clamp(4rem,12vw,10rem)] font-black text-white/[0.03] leading-none select-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            RECOMMERCE
          </p>
        </div>
      </div>
    </footer>
  );
}