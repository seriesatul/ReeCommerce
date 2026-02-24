"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import ReelViewer from "@/components/feed/ReelViewer";

// Home Components

import HeroSection from "@/components/home/HeroSection";
import TrendingReels from "@/components/home/TrendingReels";
import FeaturesBento from "@/components/home/FeaturesBento";
import CategoriesSection from "@/components/home/CategoriesSection";
import SocialProofSection from "@/components/home/SocialProofSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";
import Navbar from "@/components/ui/Navbar";

// Types
export interface IReel {
  _id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  description?: string;
  sellerId?: string;
  productId?: {
    _id: string;
    name: string;
    price: number;
  };
  metrics?: { views: number; likes: number };
}

export default function DiscoveryVault() {
  return (
    <Suspense fallback={<GlobalSkeleton />}>
      <FeedArchitecture />
    </Suspense>
  );
}

function FeedArchitecture() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reels, setReels] = useState<IReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeReelId = searchParams.get("reelId");

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch("/api/reels");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (Array.isArray(data)) setReels(data);
        else setError("Invalid response from server.");
      } catch {
        setError("Failed to load reels. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, []);

  const openReel = (id: string) => router.push(`/?reelId=${id}`, { scroll: false });
  const closeReel = () => router.push("/", { scroll: false });

  if (loading) return <GlobalSkeleton />;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        * { box-sizing: border-box; }
        
        ::selection {
          background: rgba(74, 222, 128, 0.3);
          color: white;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: #070A0F;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(74, 222, 128, 0.3);
        }

        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <main>
        <HeroSection reels={reels} onOpenReel={openReel} />
        <TrendingReels reels={reels} onOpenReel={openReel} />
        <HowItWorksSection />
        <FeaturesBento />
        <CategoriesSection />
        <SocialProofSection />
        <CTASection />
      </main>

      <Footer />

      {/* Reel Viewer Modal */}
      <AnimatePresence>
        {activeReelId && reels.length > 0 && (
          <ReelViewer
            initialReelId={activeReelId}
            reels={reels}
            onClose={closeReel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Skeleton Loader
function GlobalSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Navbar skeleton */}
      <div className="h-20 border-b border-white/[0.04]" />

      {/* Hero skeleton */}
      <div className="skeleton-shimmer h-screen w-full" />

      {/* Grid skeleton */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-24">
        <div className="skeleton-shimmer h-8 w-64 rounded-full mb-4" />
        <div className="skeleton-shimmer h-6 w-48 rounded-full mb-16" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="skeleton-shimmer aspect-[9/16] rounded-[28px]" />
              <div className="skeleton-shimmer h-5 w-3/4 rounded-full" />
              <div className="skeleton-shimmer h-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}