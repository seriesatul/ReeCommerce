"use client";

import { useEffect, useState } from "react";
import { Trash2, ExternalLink, Play, AlertOctagon, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function ContentModeration() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reels").then(res => res.json()).then(data => {
      setReels(data);
      setLoading(false);
    });
  }, []);

  const deleteReel = async (id: string) => {
    if (!confirm("Are you sure? This will remove the reel from public view.")) return;
    
    // API logic to delete or deactivate
    const res = await fetch(`/api/admin/content/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.error("Reel Takedown Successful");
      setReels(prev => prev.filter(r => r._id !== id));
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-in fade-in duration-700">
      {reels.map((reel) => (
        <div key={reel._id} className="group relative aspect-9/16 bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          <Image src={reel.thumbnailUrl} alt="Reel" fill className="object-cover transition-transform group-hover:scale-110" />
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
             <button onClick={() => window.open(`/?reelId=${reel._id}`)} className="p-3 bg-white rounded-full text-slate-900"><Play size={20} fill="black" /></button>
             <button onClick={() => deleteReel(reel._id)} className="p-3 bg-rose-600 rounded-full text-white hover:bg-rose-700 transition-all"><Trash2 size={20} /></button>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
             <p className="text-[10px] font-black text-white uppercase truncate">{reel.storeId?.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}