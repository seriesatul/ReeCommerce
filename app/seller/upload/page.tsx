"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Layout, ChevronRight, ChevronLeft, Plus, X,
  UploadCloud, AlertCircle, Trash2, Check, Play, Pause,
  Volume2, VolumeX, RotateCcw, Hash, FileText, Zap,
  ImageOff, ShieldCheck, ArrowUpRight, Layers, Tag,
  Ruler, Clock, Target, Camera, Eye, Video,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Design tokens ───────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Types ───────────────────────────────────────────────────────
interface ProductEntry {
  name: string; description: string; price: string; mrp: string;
  stock: string; weight: string; length: string; width: string; height: string;
  startTime: string; endTime: string; x: number; y: number;
  galleryFiles: File[]; returnEligible: boolean;
}

interface FormData {
  listingType: "single" | "multi";
  caption: string; hashtags: string;
  category: string; taxDetails: string;
}

const BLANK = (): ProductEntry => ({
  name: "", description: "", price: "", mrp: "", stock: "50",
  weight: "", length: "", width: "", height: "",
  startTime: "0", endTime: "5", x: 50, y: 50,
  galleryFiles: [], returnEligible: true,
});

const CATEGORIES = ["Electronics","Fashion","Beauty","Home & Living","Sports","Books","Food","Toys","Art","General"];

// ─── Input style helpers ─────────────────────────────────────────
const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  border: B, background: "#FAFAFA", color: N, fontFamily: "DM Sans,sans-serif",
  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13,
  outline: "none", boxSizing: "border-box", transition: "border-color .15s, background .15s",
  ...extra,
});
const LBL: React.CSSProperties = {
  fontSize: 9, fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "0.14em", color: M, marginBottom: 5, display: "block",
};
const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = N;
    e.currentTarget.style.background = "white";
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#E4E9F2";
    e.currentTarget.style.background = "#FAFAFA";
  },
};

// ═══════════════════════════════════════════════════════════════════
// VIDEO PREVIEW
// ═══════════════════════════════════════════════════════════════════
function VideoPreview({ file, hotspots = [] }: {
  file: File | null;
  hotspots?: { x: number; y: number; label: string }[];
}) {
  const ref    = useRef<HTMLVideoElement>(null);
  const [play, setPlay]   = useState(false);
  const [mute, setMute]   = useState(true);
  const [prog, setProg]   = useState(0);
  const [dur,  setDur]    = useState(0);

  useEffect(() => {
    const v = ref.current; if (!v) return;
    const tick = () => { setProg((v.currentTime / v.duration) * 100 || 0); };
    const meta = () => setDur(v.duration);
    v.addEventListener("timeupdate", tick);
    v.addEventListener("loadedmetadata", meta);
    v.addEventListener("ended", () => setPlay(false));
    return () => { v.removeEventListener("timeupdate", tick); v.removeEventListener("loadedmetadata", meta); };
  }, [file]);

  const toggle = () => {
    const v = ref.current; if (!v) return;
    play ? v.pause() : v.play();
    setPlay(!play);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = ref.current; if (!v || !dur) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - left) / width) * dur;
  };

  if (!file) return (
    <div style={{ aspectRatio: "9/16", borderRadius: 20, background: "white", border: "2px dashed #E4E9F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Video size={22} color="#C4CDD8" />
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#C4CDD8", textTransform: "uppercase", letterSpacing: "0.12em" }}>No video yet</p>
    </div>
  );

  return (
    <div style={{ position: "relative", aspectRatio: "9/16", borderRadius: 20, overflow: "hidden", background: "#000", boxShadow: "0 20px 60px rgba(10,22,40,0.22)" }}>
      <video ref={ref} muted={mute} playsInline src={URL.createObjectURL(file)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Hotspot dots */}
      {hotspots.map((h, i) => (
        <div key={i} style={{ position: "absolute", left: `${h.x}%`, top: `${h.y}%`, transform: "translate(-50%,-50%)", zIndex: 10 }}>
          <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
            style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid white", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={11} color="white" />
          </motion.div>
          {h.label && (
            <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 5, background: "rgba(10,22,40,0.88)", color: "white", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", letterSpacing: "0.06em" }}>
              {h.label.slice(0, 14)}{h.label.length > 14 ? "…" : ""}
            </div>
          )}
        </div>
      ))}

      {/* Gradient + controls */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 45%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "14px 14px 16px" }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.18)", borderRadius: 99, marginBottom: 12, cursor: "pointer" }} onClick={seek}>
          <div style={{ height: "100%", width: `${prog}%`, background: "white", borderRadius: 99, transition: "width .1s" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            {play ? <Pause size={13} color="white" /> : <Play size={13} color="white" />}
          </button>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
            {dur ? `${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, "0")}` : "--:--"}
          </span>
          <button onClick={() => { setMute(v => !v); if (ref.current) ref.current.muted = !mute; }}
            style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mute ? <VolumeX size={12} color="rgba(255,255,255,0.7)" /> : <Volume2 size={12} color="rgba(255,255,255,0.7)" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP BAR
// ═══════════════════════════════════════════════════════════════════
const STEPS = ["Mode", "Reel", "Products", "Review"];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: done ? N : active ? "white" : "#F0F2F8",
                border: active ? `2px solid ${N}` : done ? "none" : "2px solid #E4E9F2",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 0 4px rgba(10,22,40,0.07)` : "none",
                transition: "all .3s",
              }}>
                {done ? <Check size={11} color="white" /> : <span style={{ fontSize: 10, fontWeight: 800, color: active ? N : M }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: done || active ? N : M, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: i < current ? N : "#E4E9F2", margin: "0 6px 16px", borderRadius: 99, transition: "background .3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GALLERY PICKER
// ═══════════════════════════════════════════════════════════════════
function GalleryPicker({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={LBL}>Product Photos <span style={{ color: "#DC2626" }}>*</span></span>
        <span style={{ fontSize: 9, color: M, fontWeight: 700 }}>{files.length}/8</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(68px, 1fr))", gap: 8 }}>
        {files.map((f, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: 10, overflow: "hidden", border: B }}>
            <img src={URL.createObjectURL(f)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {i === 0 && <span style={{ position: "absolute", bottom: 3, left: 3, fontSize: 7, fontWeight: 800, background: N, color: "white", padding: "1px 5px", borderRadius: 3, textTransform: "uppercase" }}>Cover</span>}
            <button onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              style={{ position: "absolute", top: 3, right: 3, width: 16, height: 16, borderRadius: "50%", background: "rgba(10,22,40,0.75)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={8} color="white" />
            </button>
          </div>
        ))}
        {files.length < 8 && (
          <label style={{ aspectRatio: "1", borderRadius: 10, border: "2px dashed #E4E9F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: S, gap: 3 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = N; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E4E9F2"; }}>
            <Plus size={16} color={M} />
            <span style={{ fontSize: 8, color: M, fontWeight: 800, textTransform: "uppercase" }}>Add</span>
            <input type="file" multiple accept="image/*" style={{ display: "none" }}
              onChange={e => onChange([...files, ...Array.from(e.target.files ?? [])])} />
          </label>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT FORM
// ═══════════════════════════════════════════════════════════════════
function ProductForm({ p, onChange, isMulti }: {
  p: ProductEntry; onChange: (u: Partial<ProductEntry>) => void; isMulti: boolean;
}) {
  const discount = p.mrp && p.price && Number(p.mrp) > Number(p.price)
    ? Math.round((1 - Number(p.price) / Number(p.mrp)) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Name */}
      <div>
        <span style={LBL}>Product Name <span style={{ color: "#DC2626" }}>*</span></span>
        <input type="text" value={p.name} onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Sony WH-1000XM5" style={inp()} {...focusHandlers} />
      </div>

      {/* Description */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={LBL}>Description</span>
          <span style={{ fontSize: 9, color: p.description.length > 460 ? "#DC2626" : M, fontWeight: 700 }}>{p.description.length}/500</span>
        </div>
        <textarea value={p.description} maxLength={500} rows={3}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Features, materials, sizing…"
          style={inp({ resize: "none" } as any)} {...focusHandlers} />
      </div>

      {/* Pricing */}
      <div>
        <span style={LBL}>Pricing</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* MRP */}
          <div>
            <span style={{ ...LBL, marginBottom: 4 }}>MRP (₹)</span>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: M, pointerEvents: "none" }}>₹</span>
              <input type="number" min="0" value={p.mrp} onChange={e => onChange({ mrp: e.target.value })}
                placeholder="0" style={inp({ paddingLeft: 26 })} {...focusHandlers} />
            </div>
          </div>
          {/* Sale price */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ ...LBL, margin: 0 }}>Sale Price <span style={{ color: "#DC2626" }}>*</span></span>
              {discount > 0 && (
                <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0" }}>{discount}% OFF</span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: M, pointerEvents: "none" }}>₹</span>
              <input type="number" min="0" value={p.price} onChange={e => onChange({ price: e.target.value })}
                placeholder="0" style={inp({ paddingLeft: 26 })} {...focusHandlers} />
            </div>
          </div>
        </div>
      </div>

      {/* Stock */}
      <div>
        <span style={LBL}>Stock Quantity</span>
        <input type="number" min="0" value={p.stock} onChange={e => onChange({ stock: e.target.value })}
          placeholder="50" style={inp()} {...focusHandlers} />
      </div>

      {/* Gallery */}
      <GalleryPicker files={p.galleryFiles} onChange={f => onChange({ galleryFiles: f })} />

      {/* Dimensions */}
      <div style={{ padding: "14px", background: S, border: B, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ruler size={12} color={N} />
          <span style={{ ...LBL, margin: 0 }}>Shipping Dimensions</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[
            { key: "length", lbl: "L (cm)" }, { key: "width", lbl: "W (cm)" },
            { key: "height", lbl: "H (cm)" }, { key: "weight", lbl: "Wt (kg)" },
          ].map(({ key, lbl }) => (
            <div key={key}>
              <span style={{ ...LBL, marginBottom: 3 }}>{lbl}</span>
              <input type="number" min="0" step="0.01"
                value={(p as any)[key]} onChange={e => onChange({ [key]: e.target.value } as any)}
                placeholder="0" style={inp({ textAlign: "center", padding: "9px 6px" })} {...focusHandlers} />
            </div>
          ))}
        </div>
        {p.length && p.width && p.height && (
          <p style={{ fontSize: 10, color: M, marginTop: 8 }}>
            Vol. weight: <strong style={{ color: N }}>{((Number(p.length) * Number(p.width) * Number(p.height)) / 5000).toFixed(2)} kg</strong>
          </p>
        )}
      </div>

      {/* Return toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: S, border: B, borderRadius: 12 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: 0 }}>Return eligible</p>
          <p style={{ fontSize: 11, color: M, margin: 0 }}>Buyers can return this item</p>
        </div>
        <button type="button" onClick={() => onChange({ returnEligible: !p.returnEligible })}
          style={{ position: "relative", width: 40, height: 20, borderRadius: 999, background: p.returnEligible ? N : "#E4E9F2", border: "none", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}>
          <span style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", transition: "left .2s", left: p.returnEligible ? "calc(100% - 18px)" : 2 }} />
        </button>
      </div>

      {/* Hotspot — multi only */}
      {isMulti && (
        <div style={{ padding: "14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Target size={12} color="#D97706" />
            <span style={{ fontSize: 9, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.12em" }}>Hotspot Position on Video</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
            {[
              { key: "startTime", lbl: "Show at (s)" }, { key: "endTime",   lbl: "Hide at (s)" },
              { key: "x",         lbl: "X pos (%)" },   { key: "y",         lbl: "Y pos (%)" },
            ].map(({ key, lbl }) => (
              <div key={key}>
                <span style={{ ...LBL, color: "#92400E", marginBottom: 3 }}>{lbl}</span>
                <input type="number" min="0" max={key === "x" || key === "y" ? 100 : undefined}
                  value={(p as any)[key]} onChange={e => onChange({ [key]: key === "x" || key === "y" ? Number(e.target.value) : e.target.value } as any)}
                  style={inp({ textAlign: "center", padding: "9px 6px", borderColor: "#FDE68A", background: "white" })} {...focusHandlers} />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#92400E", lineHeight: 1.5, margin: 0 }}>
            The hotspot dot appears at (X%, Y%) on the video between the start and end seconds.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════════
async function uploadToCloudinary(file: File, folder: string) {
  const timestamp    = Math.round(Date.now() / 1000);
  const sigRes       = await fetch("/api/cloudinary-signature", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paramsToSign: { timestamp, folder } }),
  });
  if (!sigRes.ok) throw new Error("Signature failed");
  const { signature } = await sigRes.json();
  const fd = new FormData();
  fd.append("file", file); fd.append("signature", signature);
  fd.append("timestamp", String(timestamp));
  fd.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
  fd.append("folder", folder);
  const type  = file.type.startsWith("video") ? "video" : "image";
  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${type}/upload`, { method: "POST", body: fd });
  const data  = await upRes.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data as { secure_url: string };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function UploadStudio() {
  const router = useRouter();

  const [step,      setStep]      = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormData>({
    listingType: "single", caption: "", hashtags: "", category: "Electronics", taxDetails: "GST 18%",
  });
  const [products, setProducts] = useState<ProductEntry[]>([BLANK()]);

  // Persist form text (not files)
  useEffect(() => {
    try {
      const s = localStorage.getItem("studio_v9");
      if (s) { const p = JSON.parse(s); setForm(p.form); }
    } catch { localStorage.removeItem("studio_v9"); }
  }, []);
  useEffect(() => {
    localStorage.setItem("studio_v9", JSON.stringify({ form }));
  }, [form]);

  const patchForm     = useCallback((u: Partial<FormData>) => setForm(f => ({ ...f, ...u })), []);
  const updateProduct = useCallback((i: number, u: Partial<ProductEntry>) =>
    setProducts(prev => { const n = [...prev]; n[i] = { ...n[i], ...u }; return n; }), []);

  const addProduct = () => {
    if (products.length >= 5) { setError("Maximum 5 products per Lookbook."); return; }
    setProducts(p => [...p, BLANK()]);
    setExpanded(products.length);
    setError(null);
  };

  const removeProduct = (i: number) => {
    if (products.length <= 1) return;
    setProducts(p => p.filter((_, idx) => idx !== i));
    setExpanded(Math.max(0, expanded - 1));
  };

  const isValid = (s: number) => {
    if (s === 0) return true;
    if (s === 1) return !!videoFile && form.caption.trim().length >= 5;
    if (s === 2) return products.every(p => p.name.length > 2 && p.price !== "" && p.galleryFiles.length > 0 && p.weight !== "");
    return true;
  };

  const goNext = () => {
    if (isValid(step)) { setError(null); setStep(s => s + 1); }
    else setError(
      step === 1 ? "Upload a video and add a caption (min 5 chars)."
      : step === 2 ? "Every product needs: name, price, ≥1 photo, and weight."
      : "Complete all required fields."
    );
  };

  const hotspots = form.listingType === "multi"
    ? products.map(p => ({ x: p.x, y: p.y, label: p.name }))
    : [];

  const handleSubmit = async () => {
    setLoading(true); setProgress(5);
    try {
      const vidRes = await uploadToCloudinary(videoFile!, "reecommerce_reels");
      setProgress(25);

      const step_each = 60 / products.length;
      const processed = await Promise.all(products.map(async (p, i) => {
        const imgRes  = await Promise.all(p.galleryFiles.map(f => uploadToCloudinary(f, "reecommerce_products")));
        const urls    = imgRes.map(r => r.secure_url);
        setProgress(25 + Math.round(step_each * (i + 1)));
        return {
          name: p.name, description: p.description,
          price: Number(p.price), mrp: Number(p.mrp) || Number(p.price),
          stock: Number(p.stock), weight: Number(p.weight),
          length: Number(p.length), width: Number(p.width), height: Number(p.height),
          imageUrl: urls[0], images: urls,
          returnEligible: p.returnEligible,
          volumetricWeight: +((Number(p.length) * Number(p.width) * Number(p.height)) / 5000).toFixed(2),
          startTime: Number(p.startTime), endTime: Number(p.endTime),
          x: p.x, y: p.y,
        };
      }));

      setProgress(90);
      const res = await fetch("/api/products/multi", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, products: processed, videoUrl: vidRes.secure_url, thumbnailUrl: vidRes.secure_url.replace(/\.[^/.]+$/, ".jpg") }),
      });
      setProgress(100);
      if (res.ok) {
        localStorage.removeItem("studio_v9");
        toast.success("Reel published! 🎉");
        router.push("/dashboard/seller/reels");
      } else {
        const d = await res.json();
        throw new Error(d.error ?? "Submission failed");
      }
    } catch (e: any) {
      setError(e.message ?? "Upload failed. Please try again.");
      toast.error(e.message);
    } finally { setLoading(false); setProgress(0); }
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", fontFamily: "DM Sans, sans-serif", background: S, paddingBottom: 100 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.93)", backdropFilter: "blur(14px)", borderBottom: B, padding: "12px 28px", display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
            style={{ width: 34, height: 34, borderRadius: 10, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <ChevronLeft size={15} color="#6B7A99" />
          </button>

          <div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 18, color: N, margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Upload Studio
              {step > 0 && <em style={{ fontStyle: "italic", fontWeight: 300, opacity: 0.38, marginLeft: 8, fontSize: 16 }}>
                {form.listingType === "multi" ? "lookbook" : "spotlight"}
              </em>}
            </h1>
          </div>

          {step > 0 && (
            <div style={{ flex: 1, maxWidth: 440, margin: "0 auto" }}>
              <StepBar current={step} />
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: M, flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669" }} />
            Auto-saved
          </div>
        </div>

        {/* ── Error banner ───────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ margin: "16px 28px 0", display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12 }}>
              <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: "#DC2626", fontWeight: 600, margin: 0, flex: 1 }}>{error}</p>
              <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }}>
                <X size={13} color="#DC2626" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Page body ──────────────────────────────────────────── */}
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "28px 28px 0" }}>
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════════════════
                STEP 0 — Mode selection
            ══════════════════════════════════════════════════════ */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(2rem,4vw,2.8rem)", color: N, letterSpacing: "-0.03em", margin: "0 0 8px" }}>
                    What are you uploading?
                  </h2>
                  <p style={{ fontSize: 14, color: M }}>Choose your listing format — you can't change this after selecting</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, maxWidth: 700, margin: "0 auto" }}>

                  {/* Spotlight card */}
                  <motion.button whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(10,22,40,0.11)" }} whileTap={{ scale: 0.98 }}
                    onClick={() => { patchForm({ listingType: "single" }); setProducts([BLANK()]); setStep(1); }}
                    style={{ padding: 32, borderRadius: 22, background: "white", border: "2px solid #E4E9F2", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 18, fontFamily: "DM Sans,sans-serif", transition: "border-color .18s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = N)} onMouseLeave={e => (e.currentTarget.style.borderColor = "#E4E9F2")}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package size={22} color={N} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recommended</span>
                    </div>
                    <div>
                      <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 26, fontWeight: 900, color: N, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Spotlight</p>
                      <p style={{ fontSize: 13, color: M, lineHeight: 1.65, margin: "0 0 18px" }}>One product, one reel. Best for hero launches and high-conversion single items.</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {["1 product linked", "Full product detail form", "Direct add-to-cart CTA"].map(t => (
                          <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Check size={8} color="#059669" />
                            </div>
                            <span style={{ fontSize: 12, color: "#6B7A99" }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: N }}>
                      Get started <ArrowUpRight size={13} />
                    </div>
                  </motion.button>

                  {/* Lookbook card */}
                  <motion.button whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(10,22,40,0.28)" }} whileTap={{ scale: 0.98 }}
                    onClick={() => { patchForm({ listingType: "multi" }); setProducts([BLANK(), BLANK()]); setStep(1); }}
                    style={{ padding: 32, borderRadius: 22, background: N, border: "2px solid transparent", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 18, fontFamily: "DM Sans,sans-serif", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Layout size={22} color="white" />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pro</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 26, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Lookbook</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, margin: "0 0 18px" }}>Up to 5 products in one reel. Hotspot overlays appear at specific timestamps.</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {["Up to 5 products per reel", "Timeline-based hotspot overlays", "Interactive product cards"].map(t => (
                          <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 15, height: 15, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Zap size={8} color="rgba(255,255,255,0.9)" />
                            </div>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "white", position: "relative" }}>
                      Get started <ArrowUpRight size={13} />
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                STEP 1 — Video + Reel Details
            ══════════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" }}>

                {/* Left: video */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ cursor: "pointer" }}>
                    {videoFile
                      ? <VideoPreview file={videoFile} />
                      : (
                        <motion.div whileHover={{ borderColor: N }}
                          style={{ aspectRatio: "9/16", borderRadius: 20, background: "white", border: "2px dashed #E4E9F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "pointer", transition: "border-color .15s" }}>
                          <div style={{ width: 52, height: 52, borderRadius: 14, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <UploadCloud size={22} color={N} />
                          </div>
                          <div style={{ textAlign: "center", padding: "0 16px" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: "0 0 4px" }}>Click to upload</p>
                            <p style={{ fontSize: 10, color: M, margin: 0 }}>MP4 · Max 200MB · 9:16</p>
                          </div>
                        </motion.div>
                      )}
                    <input type="file" accept="video/*" style={{ display: "none" }}
                      onChange={e => { setVideoFile(e.target.files?.[0] ?? null); setError(null); }} />
                  </label>
                  {videoFile && (
                    <button onClick={() => setVideoFile(null)}
                      style={{ padding: "8px 0", borderRadius: 10, border: B, background: "transparent", fontSize: 11, fontWeight: 700, color: M, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#FFF1F2")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <RotateCcw size={11} /> Change video
                    </button>
                  )}
                </div>

                {/* Right: form */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, color: N, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Reel Details</h2>
                    <p style={{ fontSize: 13, color: M, margin: 0 }}>Add context to help buyers discover your content</p>
                  </div>

                  {/* Caption + hashtags */}
                  <div style={{ background: "white", border: B, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: B }}>
                      <Eye size={14} color={N} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: N }}>Public Content</span>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={LBL}>Caption <span style={{ color: "#DC2626" }}>*</span></span>
                        <span style={{ fontSize: 9, color: form.caption.length > 240 ? "#DC2626" : M, fontWeight: 700 }}>{form.caption.length}/280</span>
                      </div>
                      <textarea value={form.caption} maxLength={280} rows={4}
                        onChange={e => patchForm({ caption: e.target.value })}
                        placeholder="Describe the products in this video — be specific…"
                        style={inp({ resize: "none" } as any)} {...focusHandlers} />
                    </div>
                    <div>
                      <span style={LBL}>Hashtags</span>
                      <div style={{ position: "relative" }}>
                        <Hash size={13} color={M} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input type="text" value={form.hashtags} onChange={e => patchForm({ hashtags: e.target.value })}
                          placeholder="fashion style trending ootd"
                          style={inp({ paddingLeft: 32 })} {...focusHandlers} />
                      </div>
                      <p style={{ fontSize: 10, color: M, marginTop: 4 }}>Space-separated. # added automatically.</p>
                    </div>
                  </div>

                  {/* Category + Tax */}
                  <div style={{ background: "white", border: B, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: B }}>
                      <Layers size={14} color={N} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: N }}>Classification</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <span style={LBL}>Category</span>
                        <div style={{ position: "relative" }}>
                          <Tag size={12} color={M} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          <select value={form.category} onChange={e => patchForm({ category: e.target.value })}
                            style={inp({ paddingLeft: 30, cursor: "pointer", appearance: "none" } as any)} {...focusHandlers}>
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <span style={LBL}>Tax Slab</span>
                        <div style={{ position: "relative" }}>
                          <FileText size={12} color={M} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                          <select value={form.taxDetails} onChange={e => patchForm({ taxDetails: e.target.value })}
                            style={inp({ paddingLeft: 30, cursor: "pointer", appearance: "none" } as any)} {...focusHandlers}>
                            {["GST 0%","GST 5%","GST 12%","GST 18%","GST 28%"].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mode chip */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "white", border: B, borderRadius: 12 }}>
                    {form.listingType === "multi" ? <Layout size={13} color={N} /> : <Package size={13} color={N} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: N }}>
                      {form.listingType === "multi" ? "Lookbook" : "Spotlight"} mode
                    </span>
                    <button onClick={() => { setStep(0); setError(null); }}
                      style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: M, background: "transparent", border: "none", cursor: "pointer" }}>
                      Change →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                STEP 2 — Products
            ══════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" }}>

                {/* Left: sticky preview */}
                <div style={{ position: "sticky", top: 72 }}>
                  <VideoPreview file={videoFile} hotspots={hotspots} />
                  <div style={{ marginTop: 10, padding: "10px 14px", background: "white", border: B, borderRadius: 12 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: "0 0 3px" }}>
                      {form.listingType === "multi" ? "Lookbook" : "Spotlight"}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: 0 }}>
                      {products.length} product{products.length !== 1 ? "s" : ""} configured
                    </p>
                    {form.listingType === "multi" && (
                      <p style={{ fontSize: 10, color: M, margin: "3px 0 0" }}>Hotspots shown on video ↑</p>
                    )}
                  </div>
                </div>

                {/* Right: product accordion */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div>
                      <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, color: N, margin: "0 0 3px", letterSpacing: "-0.02em" }}>Product Details</h2>
                      <p style={{ fontSize: 12, color: M, margin: 0 }}>
                        {form.listingType === "multi" ? "Configure each product with its hotspot position and timestamp" : "Fill in your product information"}
                      </p>
                    </div>
                    {form.listingType === "multi" && products.length < 5 && (
                      <button onClick={addProduct}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, background: N, color: "white", fontSize: 11, fontWeight: 800, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <Plus size={13} /> Add Product
                      </button>
                    )}
                  </div>

                  {products.map((p, i) => {
                    const complete = p.name.length > 2 && p.price !== "" && p.galleryFiles.length > 0 && p.weight !== "";
                    const isOpen   = expanded === i;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ background: "white", border: isOpen ? `2px solid ${N}` : B, borderRadius: 18, overflow: "hidden", transition: "border .18s, box-shadow .18s", boxShadow: isOpen ? "0 8px 30px rgba(10,22,40,0.08)" : "none" }}>

                        {/* Accordion header */}
                        <div onClick={() => setExpanded(isOpen ? -1 : i)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", background: isOpen ? S : "transparent", transition: "background .15s" }}
                          onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "#FAFAFA"; }}
                          onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: isOpen ? N : "#F0F2F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .18s" }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: isOpen ? "white" : N }}>{i + 1}</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.name || `Product ${i + 1}`}
                            </p>
                            <p style={{ fontSize: 10, color: M, margin: 0 }}>
                              {p.price ? `₹${Number(p.price).toLocaleString("en-IN")}` : "Price not set"}
                              {" · "}{p.galleryFiles.length} photo{p.galleryFiles.length !== 1 ? "s" : ""}
                              {form.listingType === "multi" && p.startTime !== "" ? ` · ${p.startTime}s–${p.endTime}s` : ""}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Validation pill */}
                            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: complete ? "#F0FDF4" : "#F7F8FC", border: `1px solid ${complete ? "#BBF7D0" : "#E4E9F2"}` }}>
                              <div style={{ width: 5, height: 5, borderRadius: "50%", background: complete ? "#059669" : "#C4CDD8" }} />
                              <span style={{ fontSize: 8, fontWeight: 800, color: complete ? "#059669" : M, textTransform: "uppercase", letterSpacing: "0.1em" }}>{complete ? "Ready" : "Incomplete"}</span>
                            </div>
                            {products.length > 1 && (
                              <button onClick={e => { e.stopPropagation(); removeProduct(i); }}
                                style={{ width: 26, height: 26, borderRadius: 7, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FFF1F2"; (e.currentTarget as HTMLElement).style.borderColor = "#FECDD3"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "#E4E9F2"; }}>
                                <Trash2 size={11} color="#DC2626" />
                              </button>
                            )}
                            <ChevronRight size={13} color={M} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }} />
                          </div>
                        </div>

                        {/* Accordion body */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                              <div style={{ padding: "20px 20px 24px", borderTop: B }}>
                                <ProductForm p={p} onChange={u => updateProduct(i, u)} isMulti={form.listingType === "multi"} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════
                STEP 3 — Review & Publish
            ══════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 28, alignItems: "start" }}>

                {/* Left: final preview */}
                <div style={{ position: "sticky", top: 72 }}>
                  <VideoPreview file={videoFile} hotspots={hotspots} />
                </div>

                {/* Right: summary + publish */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, color: N, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Ready to publish</h2>
                    <p style={{ fontSize: 13, color: M, margin: 0 }}>Review your listing before it goes live</p>
                  </div>

                  {/* Summary grid */}
                  <div style={{ background: "white", border: B, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14, borderBottom: B }}>
                      <ShieldCheck size={14} color="#059669" />
                      <span style={{ fontSize: 13, fontWeight: 800, color: N }}>Listing Summary</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                      {[
                        { lbl: "Format",   val: form.listingType === "multi" ? "Lookbook" : "Spotlight" },
                        { lbl: "Category", val: form.category },
                        { lbl: "Tax",      val: form.taxDetails },
                        { lbl: "Products", val: `${products.length} item${products.length > 1 ? "s" : ""}` },
                      ].map(({ lbl, val }) => (
                        <div key={lbl} style={{ padding: "10px 12px", background: S, border: B, borderRadius: 10 }}>
                          <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: "0 0 3px" }}>{lbl}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0 }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    {form.caption && (
                      <div style={{ padding: "10px 12px", background: S, border: B, borderRadius: 10 }}>
                        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: "0 0 4px" }}>Caption</p>
                        <p style={{ fontSize: 13, color: N, lineHeight: 1.55, margin: 0 }}>{form.caption}</p>
                      </div>
                    )}
                  </div>

                  {/* Products list */}
                  <div style={{ background: "white", border: B, borderRadius: 18, overflow: "hidden" }}>
                    <div style={{ padding: "12px 18px", borderBottom: B }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: N, margin: 0 }}>Products ({products.length})</p>
                    </div>
                    {products.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: i < products.length - 1 ? "1px solid #F7F8FC" : "none" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9, overflow: "hidden", background: S, border: B, flexShrink: 0 }}>
                          {p.galleryFiles[0]
                            ? <img src={URL.createObjectURL(p.galleryFiles[0])} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageOff size={12} color="#C4CDD8" /></div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          <p style={{ fontSize: 10, color: M, margin: 0 }}>{p.galleryFiles.length} photo{p.galleryFiles.length > 1 ? "s" : ""} · {p.stock} in stock</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 16, fontWeight: 900, color: N, margin: 0 }}>₹{Number(p.price).toLocaleString("en-IN")}</p>
                          {Number(p.mrp) > Number(p.price) && (
                            <p style={{ fontSize: 10, color: M, textDecoration: "line-through", margin: 0 }}>₹{Number(p.mrp).toLocaleString("en-IN")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Publish CTA */}
                  <motion.button whileHover={loading ? {} : { scale: 1.01, boxShadow: "0 12px 36px rgba(10,22,40,0.22)" }} whileTap={loading ? {} : { scale: 0.99 }}
                    onClick={handleSubmit} disabled={loading}
                    style={{ padding: "15px 24px", borderRadius: 14, background: loading ? "#6B7A99" : N, color: "white", fontSize: 14, fontWeight: 800, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(10,22,40,0.16)", transition: "background .2s", fontFamily: "DM Sans,sans-serif" }}>
                    {loading ? (
                      <>
                        <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                        Uploading… {progress}%
                      </>
                    ) : (
                      <><ShieldCheck size={16} /> Publish to Marketplace</>
                    )}
                  </motion.button>

                  {/* Progress bar */}
                  <AnimatePresence>
                    {loading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ height: 3, background: "#E4E9F2", borderRadius: 99, overflow: "hidden" }}>
                        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }}
                          style={{ height: "100%", background: N, borderRadius: 99 }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p style={{ fontSize: 10, color: M, textAlign: "center" }}>
                    Your reel will be live within a few minutes after review.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Bottom nav ──────────────────────────────────────────── */}
        <AnimatePresence>
          {step > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)", borderTop: B, padding: "12px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => { setStep(s => s - 1); setError(null); }}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: B, background: "transparent", fontSize: 12, fontWeight: 700, color: "#6B7A99", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <ChevronLeft size={14} /> Back
              </button>

              <p style={{ fontSize: 10, fontWeight: 700, color: M, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Step {step} of {STEPS.length - 1}
              </p>

              {step < 3 && (
                <button onClick={goNext}
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 10, background: isValid(step) ? N : "#E4E9F2", color: isValid(step) ? "white" : M, fontSize: 12, fontWeight: 800, border: "none", cursor: isValid(step) ? "pointer" : "not-allowed", boxShadow: isValid(step) ? "0 4px 16px rgba(10,22,40,0.14)" : "none", transition: "all .18s" }}>
                  Continue <ChevronRight size={14} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}