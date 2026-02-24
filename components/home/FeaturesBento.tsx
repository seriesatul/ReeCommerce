"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck, Play, Star, Users } from "lucide-react";

const IMG_1 = "https://images.unsplash.com/photo-1481437156560-3205f6a55735?q=80&w=1195&auto=format&fit=crop";
const IMG_2 = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=600&auto=format&fit=crop";
const IMG_3 = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop";

const FEATURES = [
  {
    icon: Play,
    title: "Immersive Reels",
    desc: "Full-screen vertical reels that show products in real motion, real context.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Sellers",
    desc: "Every seller is authenticated. Every claim is verified.",
  },
  {
    icon: Zap,
    title: "Instant Checkout",
    desc: "From watch to buy in under 3 seconds. Frictionless by design.",
  },
];

const TESTIMONIALS = [
  { name: "Priya K.", role: "Fashion Enthusiast", rating: 5, text: "I finally know what I'm buying. The reels show everything." },
  { name: "Arjun M.", role: "Tech Reviewer", rating: 5, text: "Recommerce changed how I shop for gadgets. Completely." },
  { name: "Sneha R.", role: "Home Decor Lover", rating: 5, text: "The visualization is unreal. Returned 0 products this year." },
];

export default function FeaturesBento() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <section ref={sectionRef} className="py-24 bg-[#070A0F] relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative">

        {/* --- BENTO GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">

          {/* Large Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 bg-[#0F1520] rounded-[32px] p-10 flex flex-col justify-between min-h-[480px] border border-white/[0.05] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Play className="w-5 h-5 text-emerald-400" />
              </div>
              <h2
                className="text-4xl md:text-5xl font-black text-white leading-tight mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Better{" "}
                <em className="italic font-light text-emerald-400">Visualization</em>
                <br />
                Means Better Buys
              </h2>
              <p className="text-white/50 leading-relaxed text-base">
                A new standard for online commerce. See how products drape, move, and fit into
                the real world. Our verified sellers use cinematic reels to give you total
                confidence before you buy.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button className="self-start bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-3.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_4px_24px_rgba(74,222,128,0.3)]">
                Start Watching <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 border-2 border-[#0F1520]" />
                  ))}
                </div>
                <span className="text-white/40 text-sm">50,000+ happy shoppers</span>
              </div>
            </div>
          </motion.div>

          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{ y: y1 }}
            className="lg:col-span-4 relative rounded-[32px] overflow-hidden min-h-[480px] group cursor-pointer"
          >
            <img src={IMG_1} alt="Visualization" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-white text-sm font-medium leading-relaxed">
                  "Saw it in the reel, loved it in real life. Exactly as shown."
                </p>
                <p className="text-white/50 text-xs mt-2">— Verified Buyer</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards Column */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-emerald-500 rounded-[24px] p-8 flex flex-col justify-between flex-1"
            >
              <Users className="w-8 h-8 text-black/70" />
              <div>
                <p
                  className="text-7xl font-black text-black leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  98<span className="text-4xl">%</span>
                </p>
                <p className="text-black/70 font-semibold mt-2 text-sm">
                  Shoppers say reels helped them decide faster
                </p>
              </div>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="bg-[#0F1520] border border-white/[0.05] rounded-[24px] p-8 flex flex-col justify-between flex-1"
            >
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <div>
                <p
                  className="text-5xl font-black text-white leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  3×
                </p>
                <p className="text-white/50 font-medium mt-2 text-sm">
                  Lower return rate vs. photo-only stores
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Image Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ y: y2 }}
            className="relative rounded-[32px] overflow-hidden min-h-[280px] group cursor-pointer"
          >
            <img src={IMG_2} alt="Product Detail" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <h3
                className="text-2xl font-black text-white italic"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Shop with Confidence
              </h3>
              <p className="text-white/60 text-sm mt-1">Real products. Real motion.</p>
            </div>
          </motion.div>

          {/* Feature Pills Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="bg-[#0F1520] rounded-[32px] p-8 border border-white/[0.05] flex flex-col justify-center gap-6"
          >
            <p className="text-emerald-400 text-xs font-bold tracking-[0.2em] uppercase">Why Recommerce</p>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Image Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="relative rounded-[32px] overflow-hidden min-h-[280px] group cursor-pointer"
          >
            <img src={IMG_3} alt="Shopping Experience" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide mb-1">Verified Sellers Only</p>
                <p className="text-white font-semibold text-sm">
                  Direct access to authentic brands through spatial video
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}