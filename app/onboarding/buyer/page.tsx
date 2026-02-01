"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Check, 
  Sparkles, 
  Smartphone, 
  Shirt, 
  Zap, 
  Heart, 
  Home, 
  Gamepad2,
  ChevronRight,
  Loader2
} from "lucide-react";

const CATEGORIES = [
  { id: "tech", label: "Electronics", icon: Smartphone, color: "bg-blue-500" },
  { id: "fashion", label: "Fashion", icon: Shirt, color: "bg-rose-500" },
  { id: "fitness", label: "Fitness", icon: Zap, color: "bg-amber-500" },
  { id: "beauty", label: "Beauty", icon: Heart, color: "bg-pink-500" },
  { id: "home", label: "Home Decor", icon: Home, color: "bg-indigo-500" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, color: "bg-purple-500" },
];

export default function BuyerOnboarding() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
  if (selected.length < 3) return;
  setLoading(true);

  try {
    const res = await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interests: selected }),
    });

    if (res.ok) {
      // Industry Standard: Tell NextAuth to refresh the JWT with this new data
      await update({ 
        onboardingCompleted: true,
        // Optional: you can also pass the interests here if you need them in the session
      });

      // Force a hard refresh to the home page to ensure middleware catches the NEW cookie
      window.location.href = "/"; 
    }
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-12">
        
        {/* HEADER */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-3 bg-indigo-50 rounded-2xl animate-bounce">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            What do you <span className="text-indigo-600 italic font-serif">love?</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Pick at least <span className="text-slate-900 font-bold">3 interests</span> to personalize your reel feed.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`
                  relative group p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left
                  ${isSelected 
                    ? "border-slate-900 bg-slate-900 shadow-2xl shadow-indigo-200 -translate-y-2" 
                    : "border-slate-100 bg-white hover:border-indigo-200"}
                `}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isSelected ? "bg-indigo-600" : "bg-slate-50 group-hover:bg-indigo-50"}`}>
                  <cat.icon className={`w-6 h-6 ${isSelected ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`} />
                </div>
                <p className={`text-lg font-black tracking-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                  {cat.label}
                </p>
                
                {isSelected && (
                  <div className="absolute top-6 right-6 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center animate-in zoom-in">
                    <Check className="w-4 h-4 text-white" strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* FOOTER ACTION */}
        <div className="flex flex-col items-center space-y-6 pt-8">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 w-8 rounded-full transition-all duration-500 ${selected.length >= s ? "bg-indigo-600" : "bg-slate-100"}`} 
              />
            ))}
          </div>

          <button
            onClick={handleComplete}
            disabled={selected.length < 3 || loading}
            className="btn-primary min-w-[280px] py-5 text-xl flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Curate My Feed</span>
                <ChevronRight className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}