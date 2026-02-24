"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  { name: "Priya Kapoor", role: "Fashion Blogger", rating: 5, text: "I saw the fabric move in the reel — knew instantly it was mine. Zero doubts.", avatar: "PK" },
  { name: "Arjun Mehta", role: "Tech Reviewer", rating: 5, text: "Recommerce is what online shopping should've always been. Video changes everything.", avatar: "AM" },
  { name: "Sneha Rathi", role: "Interior Designer", rating: 5, text: "Returned 0 products this year. The reels show exactly what you get. Incredible.", avatar: "SR" },
  { name: "Rohit Das", role: "Verified Buyer", rating: 5, text: "The product was exactly as it appeared in the reel. No surprises, just satisfaction.", avatar: "RD" },
  { name: "Kavya Singh", role: "Lifestyle Creator", rating: 5, text: "Finally a platform that respects my time. I see it move, I trust it, I buy it.", avatar: "KS" },
  { name: "Vikram Nair", role: "Eco Enthusiast", rating: 5, text: "Sellers can't hide behind filters. This is the most honest way to shop online.", avatar: "VN" },
];

const AVATARS_COLORS = [
  "from-emerald-400 to-emerald-700",
  "from-amber-400 to-orange-600",
  "from-blue-400 to-indigo-700",
  "from-rose-400 to-pink-700",
  "from-violet-400 to-purple-700",
  "from-teal-400 to-cyan-700",
];

function TestimonialCard({ t, i }: { t: typeof TESTIMONIALS[0]; i: number }) {
  return (
    <div className="flex-shrink-0 w-80 bg-[#0F1520] border border-white/[0.06] rounded-[24px] p-7 flex flex-col gap-5 mr-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1">
          {[...Array(t.rating)].map((_, j) => (
            <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          ))}
        </div>
        <Quote className="w-5 h-5 text-white/10" />
      </div>
      <p className="text-white/70 text-sm leading-relaxed flex-1">"{t.text}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATARS_COLORS[i % AVATARS_COLORS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
          {t.avatar}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{t.name}</p>
          <p className="text-white/40 text-xs">{t.role}</p>
        </div>
      </div>
    </div>
  );
}

export default function SocialProofSection() {
  return (
    <section className="py-24 bg-[#070A0F] overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-emerald-400 text-xs font-bold tracking-[0.25em] uppercase mb-3">Social Proof</p>
            <h2
              className="text-4xl md:text-5xl font-black text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              4.9★{" "}
              <em className="italic font-light text-white/50">from 50K+ buyers</em>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {AVATARS_COLORS.map((c, i) => (
                <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-br ${c} border-2 border-[#070A0F]`} />
              ))}
            </div>
            <p className="text-white/40 text-sm">and counting...</p>
          </div>
        </div>
      </div>

      {/* Marquee Row 1 */}
      <div className="relative flex overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#070A0F] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#070A0F] to-transparent z-10" />
        <motion.div
          className="flex"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <TestimonialCard key={i} t={t} i={i % TESTIMONIALS.length} />
          ))}
        </motion.div>
      </div>

      {/* Marquee Row 2 (Reversed) */}
      <div className="relative flex overflow-hidden mt-5">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#070A0F] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#070A0F] to-transparent z-10" />
        <motion.div
          className="flex"
          animate={{ x: ["-50%", "0%"] }}
          transition={{ duration: 35, ease: "linear", repeat: Infinity }}
        >
          {[...TESTIMONIALS.slice().reverse(), ...TESTIMONIALS.slice().reverse()].map((t, i) => (
            <TestimonialCard key={i} t={t} i={i % TESTIMONIALS.length} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}