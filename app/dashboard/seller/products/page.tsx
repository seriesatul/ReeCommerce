"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Package, Plus, Search, Video, AlertCircle,
  RefreshCw, Edit2, Trash2, Eye, EyeOff, Globe,
  MoreVertical, X, Check, TrendingUp, Tag, Layers,
  ChevronDown, ArrowUpRight, ImageOff, Copy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  images?: string[];
  reelCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : String(n ?? 0);

const discount = (price: number, compare: number) =>
  compare > price ? Math.round((1 - price / compare) * 100) : 0;

// ─── CopyButton ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      style={{ width: 20, height: 20, borderRadius: 5, border: B, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {copied ? <Check size={10} color="#059669" /> : <Copy size={10} color={M} />}
    </button>
  );
}

// ─── Stock indicator ───────────────────────────────────────────────────────────
function StockBadge({ stock }: { stock: number }) {
  const [color, bg, border, label] =
    stock === 0  ? ["#DC2626", "#FFF1F2", "#FECDD3", "Out of stock"]
    : stock <= 5 ? ["#D97706", "#FFFBEB", "#FDE68A", "Low stock"]
    :              ["#059669", "#F0FDF4", "#BBF7D0", "In stock"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color, background: bg, border: `1px solid ${border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
      {stock > 0 ? `${stock} · ` : ""}{label}
    </span>
  );
}

// ─── Actions dropdown ──────────────────────────────────────────────────────────
function ActionsMenu({ product, onToggle, onDelete }: {
  product: Product;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const items = [
    { icon: Edit2,      label: "Edit product",  href: `/seller/products/${product._id}/edit`, danger: false },
    { icon: Video,      label: "Add reel",       href: `/seller/upload?productId=${product._id}`, danger: false },
    { icon: product.isActive !== false ? EyeOff : Eye,
                        label: product.isActive !== false ? "Deactivate" : "Activate",
                        action: () => { setOpen(false); onToggle(); }, danger: false },
    { icon: Trash2,     label: "Delete",         action: () => { setOpen(false); onDelete(); }, danger: true },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: 32, height: 32, borderRadius: 10, border: B, background: open ? S : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <MoreVertical size={14} color="#6B7A99" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.13 }}
            style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", borderRadius: 12, border: B, boxShadow: "0 8px 32px rgba(10,22,40,0.12)", minWidth: 168, overflow: "hidden", zIndex: 30 }}>
            {items.map(item => (
              item.href
                ? <Link key={item.label} href={item.href} onClick={() => setOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, color: N, textDecoration: "none", fontFamily: "DM Sans,sans-serif" }}
                    onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <item.icon size={13} />{item.label}
                  </Link>
                : <button key={item.label} onClick={item.action}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: item.danger ? "#DC2626" : N, textAlign: "left", fontFamily: "DM Sans,sans-serif" }}
                    onMouseEnter={e => (e.currentTarget.style.background = item.danger ? "#FFF1F2" : S)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <item.icon size={13} />{item.label}
                  </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onConfirm }: {
  product: Product; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,22,40,0.5)", backdropFilter: "blur(12px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }} transition={{ ease: [0.16,1,0.3,1], duration: 0.25 }}
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 400, border: B, boxShadow: "0 24px 80px rgba(10,22,40,0.2)", fontFamily: "DM Sans,sans-serif", overflow: "hidden" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "#FFF1F2", border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={18} color="#F87171" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: N, margin: "0 0 6px" }}>Delete "{product.name}"?</p>
            <p style={{ fontSize: 13, color: M, lineHeight: 1.6, margin: 0 }}>This product will be permanently removed. Any linked reels will lose their product reference.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: B, background: "transparent", fontSize: 13, fontWeight: 600, color: "#6B7A99", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Cancel</button>
            <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, background: "#F87171", color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin .6s linear infinite" }} /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Product row ───────────────────────────────────────────────────────────────
function ProductRow({ product, idx, onToggle, onDelete }: {
  product: Product; idx: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isActive  = product.isActive !== false;
  const disc      = discount(product.price, product.comparePrice ?? 0);
  const hasNoReel = !product.reelCount || product.reelCount === 0;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }} transition={{ delay: idx * 0.035, ease: [0.16,1,0.3,1] }}
      style={{ borderBottom: "1px solid #F7F8FC", opacity: isActive ? 1 : 0.55 }}
      onMouseEnter={e => (e.currentTarget.style.background = "#FAFBFF")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

      {/* Product */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: S, border: B }}>
            {product.imageUrl
              ? <Image src={product.imageUrl} alt={product.name} fill style={{ objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><ImageOff size={16} color="#C4CDD8" /></div>}
            {!isActive && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EyeOff size={12} color={M} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                {product.name}
              </p>
              {!isActive && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 5, background: "#F7F8FC", border: B, color: M, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                  Hidden
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: M, fontFamily: "monospace" }}>{product._id.slice(-8).toUpperCase()}</span>
              <CopyButton text={product._id} />
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td style={{ padding: "14px 20px" }}>
        {product.category
          ? <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: S, border: B, color: "#6B7A99" }}>{product.category}</span>
          : <span style={{ fontSize: 11, color: M }}>—</span>}
      </td>

      {/* Price & stock */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "Instrument Serif, serif", fontSize: 16, fontWeight: 900, color: N }}>
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <>
                <span style={{ fontSize: 11, color: M, textDecoration: "line-through" }}>₹{product.comparePrice.toLocaleString("en-IN")}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 5px", borderRadius: 5, background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0" }}>{disc}% off</span>
              </>
            )}
          </div>
          <StockBadge stock={product.stock} />
        </div>
      </td>

      {/* Reels */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: hasNoReel ? S : "#EEF2FF", color: hasNoReel ? M : "#4F46E5",
            border: `1px solid ${hasNoReel ? "#E4E9F2" : "#C7D2FE"}`,
          }}>
            <Video size={11} />
            {product.reelCount ?? 0} reel{product.reelCount !== 1 ? "s" : ""}
          </span>
          {hasNoReel && (
            <div title="No reels — product won't appear in discovery feed" style={{ cursor: "help" }}>
              <AlertCircle size={14} color="#D97706" />
            </div>
          )}
        </div>
      </td>

      {/* Actions */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
          <Link href={`/seller/products/${product._id}/edit`}
            style={{ width: 30, height: 30, borderRadius: 8, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Edit2 size={13} color="#6B7A99" />
          </Link>
          <ActionsMenu product={product} onToggle={() => onToggle(product._id)} onDelete={() => onDelete(product._id)} />
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<"all" | "active" | "hidden" | "low_stock" | "no_reel">("all");
  const [sortBy,   setSortBy]   = useState<"newest" | "price_asc" | "price_desc" | "stock">("newest");
  const [delTarget, setDelTarget] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefresh(true);
    try {
      const res  = await fetch("/api/seller/products");
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products ?? []);
      setProducts(list);
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleProduct = async (id: string) => {
    const p = products.find(p => p._id === id);
    if (!p) return;
    const isActive = p.isActive !== false;
    try {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.map(p => p._id === id ? { ...p, isActive: !isActive } : p));
      toast.success(isActive ? "Product hidden" : "Product activated");
    } catch { toast.error("Failed to update product"); }
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProducts(prev => prev.filter(p => p._id !== id));
      setDelTarget(null);
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete product"); }
  };

  // Stats
  const totalProducts = products.length;
  const activeCount   = products.filter(p => p.isActive !== false).length;
  const lowStock      = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const noReelCount   = products.filter(p => !p.reelCount || p.reelCount === 0).length;

  // Visible list
  const visible = products
    .filter(p => {
      if (filter === "active")    return p.isActive !== false;
      if (filter === "hidden")    return p.isActive === false;
      if (filter === "low_stock") return p.stock <= 5;
      if (filter === "no_reel")   return !p.reelCount || p.reelCount === 0;
      return true;
    })
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q) || p._id.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")  return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "stock")      return a.stock - b.stock;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: "all",       label: "All",        count: totalProducts },
    { key: "active",    label: "Active",     count: activeCount   },
    { key: "hidden",    label: "Hidden",     count: totalProducts - activeCount },
    { key: "low_stock", label: "Low stock",  count: lowStock      },
    { key: "no_reel",   label: "No reels",   count: noReelCount   },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 64, fontFamily: "DM Sans, sans-serif" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(1.6rem, 2.5vw, 2.1rem)", color: N, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
              Products
              <em style={{ fontWeight: 300, fontStyle: "italic", opacity: 0.38, marginLeft: 10 }}>inventory</em>
            </h1>
            <p style={{ fontSize: 14, color: M, margin: "4px 0 0" }}>Manage your catalogue, pricing and visibility</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => fetchProducts(true)}
              style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <RefreshCw size={15} color="#6B7A99" style={refresh ? { animation: "spin 0.7s linear infinite" } : {}} />
            </button>
            <Link href="/seller/upload"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 12, background: N, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px rgba(10,22,40,0.14)" }}>
              <Plus size={15} />
              Add product
            </Link>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Total products", value: fmt(totalProducts),  Icon: Package   },
            { label: "Active",         value: fmt(activeCount),    Icon: Globe     },
            { label: "Low stock",      value: fmt(lowStock),       Icon: AlertCircle },
            { label: "Missing reels",  value: fmt(noReelCount),    Icon: Video     },
          ].map(({ label, value, Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: "white", border: B, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} color={N} />
              </div>
              <div>
                <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, fontWeight: 900, color: N, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: M, margin: "3px 0 0" }}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Search + filter bar ──────────────────────────────────── */}
        <div style={{ background: "white", border: B, borderRadius: 16, padding: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={15} color={M} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, category or ID…"
              style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: B, background: S, fontSize: 13, color: N, outline: "none", fontFamily: "DM Sans,sans-serif", boxSizing: "border-box" }}
              onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = S; }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: S, border: B, borderRadius: 12, overflowX: "auto" }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "DM Sans,sans-serif", whiteSpace: "nowrap",
                  background: filter === f.key ? "white" : "transparent",
                  color: filter === f.key ? N : M,
                  boxShadow: filter === f.key ? "0 1px 4px rgba(10,22,40,0.08)" : "none", transition: "all .15s" }}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{ padding: "10px 14px", borderRadius: 10, border: B, background: S, fontSize: 12, fontWeight: 700, color: "#6B7A99", outline: "none", cursor: "pointer", fontFamily: "DM Sans,sans-serif" }}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
            <option value="stock">Stock: low → high</option>
          </select>
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${N}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M }}>Loading products…</p>
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "white", border: "1px dashed #E4E9F2", borderRadius: 20, padding: "64px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Package size={24} color="#C4CDD8" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: N, margin: "0 0 8px" }}>No products yet</p>
            <p style={{ fontSize: 14, color: M, margin: "0 0 24px" }}>Add your first product to start selling</p>
            <Link href="/seller/upload"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 12, background: N, color: "white", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              <Plus size={15} /> Add product
            </Link>
          </motion.div>
        ) : visible.length === 0 ? (
          <div style={{ background: "white", border: B, borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: M }}>No products match your filters</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F4F6FB" }}>
                    {["Product", "Category", "Price & Stock", "Reels", ""].map((h, i) => (
                      <th key={i} style={{ padding: "14px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {visible.map((product, i) => (
                      <ProductRow
                        key={product._id}
                        product={product}
                        idx={i}
                        onToggle={toggleProduct}
                        onDelete={(id) => setDelTarget(products.find(p => p._id === id) ?? null)}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 20px", borderTop: "1px solid #F4F6FB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: M, margin: 0 }}>Showing {visible.length} of {products.length} products</p>
              <Link href="/seller/upload"
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: N, textDecoration: "none", opacity: 0.8 }}
                onMouseEnter={(e: any) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e: any) => (e.currentTarget.style.opacity = "0.8")}>
                <Plus size={13} /> Add new
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── No-reel warning banner ──────────────────────────────── */}
        {noReelCount > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14 }}>
            <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#92400E", margin: 0, flex: 1 }}>
              {noReelCount} product{noReelCount > 1 ? "s" : ""} without reels — these won't appear in the discovery feed.
            </p>
            <button onClick={() => setFilter("no_reel")}
              style={{ fontSize: 12, fontWeight: 700, color: "#D97706", background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              View all →
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {delTarget && (
          <DeleteModal
            product={delTarget}
            onClose={() => setDelTarget(null)}
            onConfirm={() => deleteProduct(delTarget._id)}
          />
        )}
      </AnimatePresence>
    </>
  );
}