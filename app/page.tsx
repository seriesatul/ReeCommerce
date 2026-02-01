"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReelCard from "@/components/ui/ReelCard";
import ReelViewer from "@/components/feed/ReelViewer"; // 1. IMPORTED VIEWER
import { 
  Loader2, 
  Sparkles, 
  Filter, 
  Search, 
  LayoutGrid, 
  Zap 
} from "lucide-react";

// Wrapper for Suspense (Best practice for useSearchParams in Next.js App Router)
export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FeedContent />
    </Suspense>
  );
}

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 1. States
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. URL State for the Viewer
  const activeReelId = searchParams.get("reelId");

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch("/api/reels");
        const data = await res.json();
        if (Array.isArray(data)) {
          setReels(data);
        } else {
          setError("Failed to load discovery feed.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, []);

  // 3. Navigation Handler (Industry Standard for Modals)
  const openReel = (id: string) => {
    // scroll: false keeps the background grid position when modal opens
    router.push(`/?reelId=${id}`, { scroll: false });
  };

  const closeReel = () => {
    router.push(`/`, { scroll: false });
  };

  if (loading) return <LoadingScreen />;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- 1. HERO / BRANDING SECTION --- */}
        <section className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-tighter">
                <Sparkles className="w-3 h-3" />
                2025 Collection Live
              </div>
              <h1 className="text-6xl font-black text-slate-900 tracking-tight">
                Shop in <span className="text-indigo-600">Motion.</span>
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-md">
                Experience products through the lens of the world's best creators.
              </p>
            </div>

            {/* Quick Stats / Social Proof */}
            <div className="hidden lg:flex items-center gap-8 border-l-2 border-slate-100 pl-8">
              <div>
                <p className="text-2xl font-black text-slate-900">12.4K</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Daily Views</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">850+</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Verified Stores</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 2. DISCOVERY FILTERS (Amazon Layer) --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 sticky top-20 z-30 bg-white/80 backdrop-blur-md py-4 border-b border-slate-50">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-2 md:pb-0">
            {["All", "Fashion", "Electronics", "Home", "Beauty", "Fitness"].map((cat, i) => (
              <button 
                key={cat} 
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  i === 0 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search reels..." 
                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none font-medium" 
              />
            </div>
            <button className="p-2 bg-slate-50 rounded-xl text-slate-900 hover:bg-slate-100 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- 3. THE FEED GRID (Instagram Layer) --- */}
        {error ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-3xl text-center">
            <p className="text-red-600 font-bold">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {reels.map((reel: any) => (
              <ReelCard 
                key={reel._id} 
                reel={reel} 
                onClick={() => openReel(reel._id)} 
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reels.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="p-6 bg-slate-50 rounded-full text-slate-300">
              <LayoutGrid className="w-12 h-12" />
            </div>
            <p className="text-slate-400 font-bold italic text-lg">The feed is empty. Start the movement.</p>
            <button className="btn-primary" onClick={() => router.push('/seller/upload')}>Upload First Reel</button>
          </div>
        )}
      </div>

      {/* --- 4. VERTICAL VIEWER MODAL (TikTok Layer) --- */}
      {/* 
          This is the "Immersive Player" we built in Step 2.
          It renders automatically when reelId is present in URL.
      */}
      {activeReelId && reels.length > 0 && (
        <ReelViewer 
          initialReelId={activeReelId} 
          reels={reels} 
          onClose={closeReel} 
        />
      )}
    </main>
  );
}

// Extracting Loading State to a component for reuse
function LoadingScreen() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Feed</p>
    </div>
  );
}