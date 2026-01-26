"use client";

import { useEffect, useState } from "react";
import ReelCard from "@/components/ui/ReelCard";
import { Loader2, Zap } from "lucide-react";

export default function Home() {
  const [reels, setReels] = useState<any[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch("/api/reels");
        const data = await res.json();

        // Safety Check: Ensure data is actually an array before mapping
        if (Array.isArray(data)) {
          setReels(data);
        } else {
          console.error("API Error Response:", data);
          setError(data.error || "Failed to load reels");
          setReels([]);
        }
      } catch (err) {
        console.error("Network/Fetch Error:", err);
        setError("Could not connect to the server");
        setReels([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header Section */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
            Discover <span className="text-indigo-600 italic">Reels</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">
            Shop the world's most engaging video-first marketplace.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg">
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          Live Drops
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
          Error: {error}
        </div>
      )}

      {/* Reel Grid */}
      {reels.length === 0 && !error ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium text-lg italic">
            No reels found. Be the first to upload your product!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {reels.map((reel) => (
            <ReelCard 
              key={reel._id} 
              reel={reel} 
              onClick={() => alert("Vertical Reel Viewer coming next!")} 
            />
          ))}
        </div>
      )}
    </div>
  );
}