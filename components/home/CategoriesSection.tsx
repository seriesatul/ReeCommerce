"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CATEGORIES = [
  {
    name: "Fashion & Apparel",
    count: "2.4K reels",
    emoji: "👗",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=600&auto=format&fit=crop",
    color: "#1a1a2e",
  },
  {
    name: "Kitchen & Home",
    count: "1.8K reels",
    emoji: "🏡",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=600&auto=format&fit=crop",
    color: "#0f2027",
  },
  {
    name: "Electronics",
    count: "3.1K reels",
    emoji: "⚡",
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=600&auto=format&fit=crop",
    color: "#0f2d27",
  },
  {
    name: "Beauty & Wellness",
    count: "1.2K reels",
    emoji: "✨",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop",
    color: "#1a0f2e",
  },
  {
    name: "Sports & Outdoors",
    count: "950 reels",
    emoji: "🏃",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop",
    color: "#0f2027",
  },
  {
    name: "Art & Collectibles",
    count: "680 reels",
    emoji: "🎨",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop",
    color: "#27100f",
  },
];

export default function CategoriesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 bg-[#070A0F]">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              className="text-emerald-400 text-xs font-bold tracking-[0.25em] uppercase mb-3"
            >
              Explore by Category
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl font-black text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Shop by{" "}
              <em className="italic font-light text-white/60">Category</em>
            </motion.h2>
          </div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold transition-colors group"
          >
            All Categories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="group relative rounded-[24px] overflow-hidden cursor-pointer aspect-[3/4]"
            >
              {/* BG Image */}
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />

              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              <div
                className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 50%, ${cat.color}, transparent)` }}
              />

              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <span className="text-3xl">{cat.emoji}</span>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight mb-1">{cat.name}</h3>
                  <p className="text-white/50 text-xs">{cat.count}</p>
                  <div className="mt-3 flex items-center gap-1 text-emerald-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                    Explore <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}