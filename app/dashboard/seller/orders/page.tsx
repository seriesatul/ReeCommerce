"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ShoppingBag, Truck, CheckCircle2, User, ChevronRight,
  Loader2, PackageCheck, Search, RefreshCw, X, ChevronDown,
  MapPin, Phone, Mail, Clock, IndianRupee, Package,
  AlertCircle, Copy, Check, TrendingUp, Filter,
  ArrowUpRight, Bike, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  productId: { _id: string; name: string; imageUrl?: string; price: number } | null;
  quantity: number;
  price: number;
}
interface Order {
  _id: string;
  buyerId: { _id: string; name: string; email?: string; phone?: string } | null;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress?: { line1?: string; city?: string; state?: string; pincode?: string };
  createdAt: string;
  updatedAt?: string;
}

// ─── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:    { label: "Pending",    color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: Clock,        next: "processing" },
  processing: { label: "Processing", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", Icon: Package,      next: "shipped"    },
  shipped:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", Icon: Bike,         next: "delivered"  },
  delivered:  { label: "Delivered",  color: "#059669", bg: "#F0FDF4", border: "#BBF7D0", Icon: CheckCircle2, next: null         },
  cancelled:  { label: "Cancelled",  color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3", Icon: X,            next: null         },
} as const;

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n}`;
const relDate = (iso: string) => {
  const d = Date.now() - new Date(iso).getTime();
  const days = Math.floor(d / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

// ─── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Order["status"] }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const { Icon } = cfg;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─── Progress stepper ──────────────────────────────────────────────────────────
function OrderProgress({ status }: { status: Order["status"] }) {
  if (status === "cancelled") return null;
  const activeIdx = STATUS_STEPS.indexOf(status as any);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "12px 0 4px" }}>
      {STATUS_STEPS.map((step, i) => {
        const done    = i <= activeIdx;
        const current = i === activeIdx;
        const cfg     = STATUS_CFG[step];
        const { Icon } = cfg;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STATUS_STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? N : "#F0F2F8", border: `2px solid ${done ? N : "#E4E9F2"}`,
                boxShadow: current ? `0 0 0 4px rgba(10,22,40,0.08)` : "none",
                transition: "all .3s",
              }}>
                <Icon size={12} color={done ? "white" : M} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: done ? N : M, whiteSpace: "nowrap" }}>
                {cfg.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < activeIdx ? N : "#E4E9F2", margin: "0 6px 18px", transition: "background .3s", borderRadius: 99 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} title="Copy order ID"
      style={{ width: 22, height: 22, borderRadius: 6, border: B, background: "transparent", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      {copied ? <Check size={11} color="#059669" /> : <Copy size={11} color={M} />}
    </button>
  );
}

// ─── OrderCard ─────────────────────────────────────────────────────────────────
function OrderCard({ order, idx, onStatusChange }: {
  order: Order; idx: number;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg  = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
  const next = cfg.next;

  const advance = async () => {
    if (!next) return;
    setUpdating(true);
    try { await onStatusChange(order._id, next); }
    finally { setUpdating(false); }
  };

  const itemPreview = order.items?.slice(0, 2) ?? [];
  const extraItems  = (order.items?.length ?? 0) - 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
      style={{ background: "white", border: B, borderRadius: 20, overflow: "hidden",
        boxShadow: expanded ? "0 8px 40px rgba(10,22,40,0.08)" : "none",
        transition: "box-shadow .2s" }}>

      {/* ── Top row ── */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#FAFBFF")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

        {/* Avatar */}
        <div style={{ width: 40, height: 40, borderRadius: 12, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={16} color={N} />
        </div>

        {/* Customer + order ID */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: N }}>
              {order.buyerId?.name ?? "Unknown"}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: M, fontFamily: "monospace" }}>#{order._id.slice(-8).toUpperCase()}</span>
            <CopyButton text={order._id} />
            <span style={{ fontSize: 10, color: M }}>·</span>
            <span style={{ fontSize: 11, color: M }}>{relDate(order.createdAt)}</span>
          </div>
        </div>

        {/* Amount + expand icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 16, fontWeight: 800, color: N, margin: 0, fontFamily: "Instrument Serif, serif" }}>
              ₹{order.totalAmount?.toLocaleString("en-IN")}
            </p>
            <p style={{ fontSize: 10, color: M, margin: 0 }}>{order.items?.length ?? 0} item{order.items?.length !== 1 ? "s" : ""}</p>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} color={M} />
          </motion.div>
        </div>
      </div>

      {/* ── Item thumbnails strip (collapsed preview) ── */}
      {!expanded && itemPreview.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 20px 14px" }}>
          {itemPreview.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: S, border: B, borderRadius: 8 }}>
              <Package size={11} color={M} />
              <span style={{ fontSize: 11, fontWeight: 600, color: N, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.productId?.name ?? "Product"}
              </span>
              <span style={{ fontSize: 10, color: M }}>×{item.quantity}</span>
            </div>
          ))}
          {extraItems > 0 && (
            <span style={{ fontSize: 11, color: M, fontWeight: 600 }}>+{extraItems} more</span>
          )}
        </div>
      )}

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}>
            <div style={{ borderTop: B, padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Progress */}
              <OrderProgress status={order.status} />

              {/* Items list */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, marginBottom: 10 }}>Order Items</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(order.items ?? []).map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: S, border: B, borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "#EEF0F8", border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        {item.productId?.imageUrl
                          ? <img src={item.productId.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <Package size={14} color={M} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.productId?.name ?? "Unknown product"}
                        </p>
                        <p style={{ fontSize: 11, color: M, margin: 0 }}>Qty: {item.quantity}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: N }}>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-col: Customer + Shipping */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {/* Customer info */}
                <div style={{ padding: "14px 16px", background: S, border: B, borderRadius: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, marginBottom: 10 }}>Customer</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <User size={12} color={M} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: N }}>{order.buyerId?.name ?? "—"}</span>
                    </div>
                    {order.buyerId?.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mail size={12} color={M} />
                        <span style={{ fontSize: 12, color: N }}>{order.buyerId.email}</span>
                      </div>
                    )}
                    {order.buyerId?.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Phone size={12} color={M} />
                        <span style={{ fontSize: 12, color: N }}>{order.buyerId.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping */}
                {order.shippingAddress && (
                  <div style={{ padding: "14px 16px", background: S, border: B, borderRadius: 14 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, marginBottom: 10 }}>Ship To</p>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <MapPin size={12} color={M} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: N, lineHeight: 1.6 }}>
                        {[order.shippingAddress.line1, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount breakdown */}
              <div style={{ padding: "14px 16px", background: S, border: B, borderRadius: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M, margin: 0 }}>Order Total</p>
                  <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, fontWeight: 900, color: N, margin: 0 }}>₹{order.totalAmount?.toLocaleString("en-IN")}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {/* Advance status */}
                {next && order.status !== "cancelled" && (
                  <button onClick={advance} disabled={updating}
                    style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 12, background: N, color: "white", fontSize: 13, fontWeight: 700, border: "none", cursor: updating ? "not-allowed" : "pointer", opacity: updating ? 0.7 : 1, boxShadow: "0 4px 16px rgba(10,22,40,0.14)" }}>
                    {updating
                      ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                      : (() => { const IC = STATUS_CFG[next as keyof typeof STATUS_CFG]?.Icon; return IC ? <IC size={14} /> : null; })()}
                    Mark as {STATUS_CFG[next as keyof typeof STATUS_CFG]?.label}
                  </button>
                )}

                {/* Cancel — only for pending/processing */}
                {(order.status === "pending" || order.status === "processing") && (
                  <button onClick={async () => { setUpdating(true); try { await onStatusChange(order._id, "cancelled"); } finally { setUpdating(false); } }}
                    disabled={updating}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, background: "#FFF1F2", color: "#DC2626", fontSize: 13, fontWeight: 700, border: "1px solid #FECDD3", cursor: "pointer" }}>
                    <X size={13} />
                    Cancel order
                  </button>
                )}

                {/* Re-activate cancelled */}
                {order.status === "cancelled" && (
                  <button onClick={async () => { setUpdating(true); try { await onStatusChange(order._id, "pending"); } finally { setUpdating(false); } }}
                    disabled={updating}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, background: S, color: N, fontSize: 13, fontWeight: 700, border: B, cursor: "pointer" }}>
                    <RotateCcw size={13} />
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SellerOrders() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefresh(true);
    try {
      const res  = await fetch("/api/seller/orders");
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.orders ?? []);
      setOrders(list);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/seller/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus as Order["status"] } : o));
      toast.success(`Order marked as ${newStatus}`);
    } catch { toast.error("Status update failed"); }
  };

  // Stats
  const total    = orders.length;
  const pending  = orders.filter(o => o.status === "pending").length;
  const shipped  = orders.filter(o => o.status === "shipped").length;
  const revenue  = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  // Filter counts
  const counts: Record<string, number> = {
    all: orders.length,
    pending:    orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped:    orders.filter(o => o.status === "shipped").length,
    delivered:  orders.filter(o => o.status === "delivered").length,
    cancelled:  orders.filter(o => o.status === "cancelled").length,
  };

  const visible = orders
    .filter(o => filter === "all" || o.status === filter)
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        o._id.toLowerCase().includes(q) ||
        (o.buyerId?.name ?? "").toLowerCase().includes(q) ||
        (o.buyerId?.email ?? "").toLowerCase().includes(q)
      );
    });

  const TABS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const;

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
              Fulfillment Studio
              <em style={{ fontWeight: 300, fontStyle: "italic", opacity: 0.38, marginLeft: 10 }}>orders</em>
            </h1>
            <p style={{ fontSize: 14, color: M, margin: "4px 0 0" }}>Dispatch orders and track deliveries</p>
          </div>
          <button onClick={() => fetchOrders(true)}
            style={{ width: 36, height: 36, borderRadius: 10, border: B, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = S)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <RefreshCw size={15} color="#6B7A99" style={refresh ? { animation: "spin 0.7s linear infinite" } : {}} />
          </button>
        </div>

        {/* ── Summary stats ───────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { label: "Total orders",  value: String(total),     Icon: ShoppingBag   },
            { label: "Pending",       value: String(pending),   Icon: Clock         },
            { label: "In transit",    value: String(shipped),   Icon: Truck         },
            { label: "Revenue",       value: fmt(revenue),      Icon: TrendingUp    },
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
              placeholder="Search by name, email or order ID…"
              style={{ width: "100%", paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 10, border: B, background: S, fontSize: 13, color: N, outline: "none", fontFamily: "DM Sans,sans-serif", boxSizing: "border-box" }}
              onFocus={e => { e.currentTarget.style.borderColor = N; e.currentTarget.style.background = "white"; }}
              onBlur={e  => { e.currentTarget.style.borderColor = "#E4E9F2"; e.currentTarget.style.background = S; }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: S, border: B, borderRadius: 12, overflowX: "auto" }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setFilter(tab)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "DM Sans,sans-serif", whiteSpace: "nowrap",
                  background: filter === tab ? "white" : "transparent",
                  color: filter === tab ? N : M,
                  boxShadow: filter === tab ? "0 1px 4px rgba(10,22,40,0.08)" : "none", transition: "all .15s" }}>
                {tab === "all" ? `All (${counts.all})` : `${STATUS_CFG[tab as keyof typeof STATUS_CFG]?.label ?? tab} (${counts[tab] ?? 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 14 }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${N}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: M }}>Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "white", border: "1px dashed #E4E9F2", borderRadius: 20, padding: "64px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: S, border: B, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <ShoppingBag size={24} color="#C4CDD8" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: N, margin: "0 0 8px" }}>No orders yet</p>
            <p style={{ fontSize: 14, color: M, margin: 0 }}>Orders from buyers will appear here</p>
          </motion.div>
        ) : visible.length === 0 ? (
          <div style={{ background: "white", border: B, borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: M }}>No orders match your filters</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <AnimatePresence>
              {visible.map((order, i) => (
                <OrderCard key={order._id} order={order} idx={i} onStatusChange={handleStatusChange} />
              ))}
            </AnimatePresence>

            {/* Footer count */}
            <p style={{ fontSize: 11, color: M, textAlign: "center", marginTop: 8 }}>
              Showing {visible.length} of {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>
    </>
  );
}