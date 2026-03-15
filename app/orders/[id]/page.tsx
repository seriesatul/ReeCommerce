"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, Package, Truck, CheckCircle2,
  ChevronLeft, MapPin, ShieldCheck,
  ChevronRight, Store, Phone, Copy, Check,
  IndianRupee, CalendarDays, CreditCard,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Design tokens ────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Status pipeline ─────────────────────────────────────────────
const STEPS = [
  {
    status:  "pending",
    label:   "Order Placed",
    sub:     "We've received your order",
    icon:    Clock,
  },
  {
    status:  "processing",
    label:   "Processing",
    sub:     "Seller is preparing your order",
    icon:    Package,
  },
  {
    status:  "shipped",
    label:   "In Transit",
    sub:     "Your order is on the way",
    icon:    Truck,
  },
  {
    status:  "delivered",
    label:   "Delivered",
    sub:     "Enjoy your purchase!",
    icon:    CheckCircle2,
  },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending:    { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  processing: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
  shipped:    { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  delivered:  { bg: "#F0FDF4", text: "#059669", border: "#BBF7D0" },
  cancelled:  { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3" },
};

// ─── Helpers ─────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        padding: "4px 8px", borderRadius: 8, border: B,
        background: "white", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 4,
        fontSize: 10, fontWeight: 700, color: copied ? "#059669" : M,
        transition: "all .15s",
      }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
export default function OrderTrackingPage() {
  const { id }            = useParams();
  const { data: session } = useSession();
  const router            = useRouter();

  const [order,   setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── useCallback so Pusher effect doesn't capture stale closure ──
  const fetchOrder = useCallback(async () => {
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Order not found"); return; }
      setOrder(data);
    } catch {
      setError("Failed to load order. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Real-time status updates via Pusher
  useEffect(() => {
    if (!session?.user?.id) return;

    const pusher  = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`user-${session.user.id}`);

    channel.bind("new-notification", (data: any) => {
      // Only re-fetch if this notification is about THIS order
      if (data.orderId && data.orderId !== id) return;
      fetchOrder();
    });

    // Cleanup always runs — not inside the if block
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${session.user.id}`);
    };
  }, [id, session?.user?.id, fetchOrder]);

  // ── Loading ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: S, gap: 16, fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: `2px solid ${N}`, borderTopColor: "transparent",
        animation: "spin .65s linear infinite",
      }} />
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: M }}>
        Loading order…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────
  if (error || !order) return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: S, gap: 16, fontFamily: "'DM Sans', sans-serif",
      padding: 24,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: "#FFF1F2",
        border: "1px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Package size={24} color="#E11D48" />
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: N }}>{error ?? "Order not found"}</p>
      <button
        onClick={() => router.back()}
        style={{
          padding: "10px 20px", borderRadius: 12, border: B,
          background: "white", color: N, fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}
      >
        Go back
      </button>
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const statusColor       = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;

  // Safe populated field access
  const storeName = typeof order.storeId === "object"
    ? order.storeId?.name ?? "Store"
    : "Store";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(.85); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: S, fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>

        {/* ── Navbar ───────────────────────────────────────────── */}
        <nav style={{
          background: "white", borderBottom: B,
          position: "sticky", top: 0, zIndex: 40,
          padding: "0 24px",
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto",
            height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button
              onClick={() => router.back()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                color: M, fontSize: 13, fontWeight: 700, background: "none",
                border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.22em", color: M }}>
              Order Tracking
            </p>

            {/* Live badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", borderRadius: 99,
              background: "#F0FDF4", border: "1px solid #BBF7D0",
              fontSize: 10, fontWeight: 800, color: "#059669",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", animation: "pulse-dot 1.5s ease-in-out infinite", display: "inline-block" }} />
              Live
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

          {/* ── Page header ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: 28 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                color: N, letterSpacing: "-0.025em", margin: 0,
              }}>
                Order{" "}
                <em style={{ fontStyle: "italic", color: M }}>
                  #{order._id.slice(-8).toUpperCase()}
                </em>
              </h1>

              <div style={{
                padding: "4px 12px", borderRadius: 99,
                background: statusColor.bg, border: `1px solid ${statusColor.border}`,
                fontSize: 11, fontWeight: 800, color: statusColor.text,
                textTransform: "capitalize",
              }}>
                {order.status}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: M, display: "flex", alignItems: "center", gap: 5 }}>
                <CalendarDays size={13} />
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span style={{ fontSize: 12, color: M, display: "flex", alignItems: "center", gap: 5 }}>
                <Store size={13} /> {storeName}
              </span>
              <span style={{ fontSize: 12, color: M, display: "flex", alignItems: "center", gap: 5 }}>
                <CreditCard size={13} />
                {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>
          </motion.div>

          {/* ── Main grid ────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

            {/* ── LEFT COLUMN ──────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Progress stepper */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "white", borderRadius: 20, border: B, padding: "28px 32px" }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: M, marginBottom: 28 }}>
                  Delivery Progress
                </p>

                {/* Steps */}
                <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
                  {STEPS.map((step, idx) => {
                    const isDone    = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;
                    const Icon      = step.icon;

                    return (
                      <div key={step.status} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>

                        {/* Connector line */}
                        {idx < STEPS.length - 1 && (
                          <div style={{
                            position: "absolute",
                            top: 20, left: "50%", width: "100%", height: 2,
                            background: idx < currentStepIndex ? N : "#E4E9F2",
                            transition: "background .6s ease",
                            zIndex: 0,
                          }} />
                        )}

                        {/* Circle */}
                        <motion.div
                          animate={{
                            background:   isDone ? N : "white",
                            borderColor:  isDone ? N : "#E4E9F2",
                            scale:        isCurrent ? 1.1 : 1,
                          }}
                          transition={{ duration: 0.4 }}
                          style={{
                            position: "relative", zIndex: 1,
                            width: 40, height: 40, borderRadius: "50%",
                            border: "2px solid",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: isCurrent ? `0 0 0 4px rgba(10,22,40,0.08)` : "none",
                          }}
                        >
                          {isCurrent && (
                            <div style={{
                              position: "absolute", inset: -4, borderRadius: "50%",
                              border: "1.5px solid rgba(10,22,40,0.15)",
                              animation: "pulse-dot 1.5s ease-in-out infinite",
                            }} />
                          )}
                          <Icon size={16} color={isDone ? "white" : "#C4CDD8"} />
                        </motion.div>

                        {/* Label */}
                        <div style={{ marginTop: 12, textAlign: "center", padding: "0 4px" }}>
                          <p style={{
                            fontSize: 11, fontWeight: 800,
                            color: isCurrent ? N : isDone ? N : M,
                            marginBottom: 2,
                          }}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{ fontSize: 10, color: M, lineHeight: 1.4 }}
                            >
                              {step.sub}
                            </motion.p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Delivery address + map placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "white", borderRadius: 20, border: B, overflow: "hidden" }}
              >
                {/* Map placeholder */}
                <div style={{
                  height: 180,
                  background: `linear-gradient(135deg, ${N}08 0%, ${N}14 100%)`,
                  position: "relative",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderBottom: B,
                }}>
                  {/* Dot grid */}
                  <div style={{
                    position: "absolute", inset: 0, opacity: 0.06,
                    backgroundImage: `radial-gradient(circle, ${N} 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                  }} />

                  {/* Fake route line */}
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                    <path
                      d="M 80,140 C 150,80 250,120 320,60 C 380,20 420,80 500,50"
                      fill="none" stroke={N} strokeWidth="1.5"
                      strokeDasharray="6 4" opacity="0.18"
                    />
                  </svg>

                  {/* Origin pin */}
                  <div style={{ position: "absolute", left: 80, top: 135 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: N, border: "2px solid white",
                      boxShadow: "0 2px 6px rgba(10,22,40,0.3)",
                    }} />
                  </div>

                  {/* Destination pin */}
                  <div style={{ position: "absolute", right: 120, top: 32 }}>
                    <div style={{
                      padding: "6px 12px", borderRadius: 10,
                      background: N, color: "white",
                      fontSize: 10, fontWeight: 800,
                      boxShadow: "0 4px 12px rgba(10,22,40,0.25)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}>
                      <MapPin size={10} />
                      {order.shippingAddress?.city}
                    </div>
                    {/* Pin tail */}
                    <div style={{
                      width: 0, height: 0,
                      borderLeft: "5px solid transparent",
                      borderRight: "5px solid transparent",
                      borderTop: `6px solid ${N}`,
                      margin: "0 auto",
                    }} />
                  </div>

                  {/* Courier dot */}
                  <motion.div
                    animate={{ x: [0, 12, 0], y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    style={{ position: "absolute", left: "40%", top: "40%" }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "white", border: `2px solid ${N}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(10,22,40,0.15)",
                    }}>
                      <Truck size={12} color={N} />
                    </div>
                  </motion.div>

                  <div style={{
                    position: "absolute", bottom: 12, left: 16,
                    fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.15em", color: M,
                  }}>
                    Live tracking · GPS sync pending
                  </div>
                </div>

                {/* Address info */}
                <div style={{ padding: "20px 24px" }}>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: M, marginBottom: 12 }}>
                    Delivering to
                  </p>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: S,
                      border: B, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <MapPin size={15} color={N} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: N, marginBottom: 3 }}>
                        {order.shippingAddress?.fullName}
                      </p>
                      <p style={{ fontSize: 12, color: M, lineHeight: 1.6, margin: 0 }}>
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}<br />
                        {order.shippingAddress?.state} — {order.shippingAddress?.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Items list */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "white", borderRadius: 20, border: B, overflow: "hidden" }}
              >
                <div style={{ padding: "18px 24px", borderBottom: B, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: M }}>
                    Items ordered
                  </p>
                  <span style={{ fontSize: 11, fontWeight: 700, color: M }}>
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {order.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 24px",
                      borderBottom: i < order.items.length - 1 ? "1px solid #F7F8FC" : "none",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: 44, height: 56, borderRadius: 10, overflow: "hidden",
                      background: S, border: B, flexShrink: 0,
                    }}>
                      {item.image && (
                        <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: N, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize: 11, color: M, marginTop: 2 }}>Qty: {item.quantity}</p>
                    </div>

                    <p style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: 16, fontWeight: 400, color: N, flexShrink: 0,
                    }}>
                      ₹{(item.priceAtPurchase * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  padding: "16px 24px", borderTop: B,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: S,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: M }}>
                    Total Paid
                  </span>
                  <span style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 22, color: N, fontWeight: 400,
                  }}>
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Order ID card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: N, borderRadius: 20, padding: "24px", position: "relative", overflow: "hidden" }}
              >
                {/* Dot grid */}
                <div style={{
                  position: "absolute", inset: 0, opacity: 0.04,
                  backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                  backgroundSize: "18px 18px", pointerEvents: "none",
                }} />

                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ShieldCheck size={16} color="white" />
                    </div>
                    <div>
                      <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                        Order ID
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "white", margin: 0 }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <CopyButton text={order._id} />
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: "12px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Status</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: "white",
                      textTransform: "capitalize",
                    }}>
                      {order.status}
                    </span>
                  </div>

                  {/* Payment */}
                  <div style={{
                    padding: "12px 16px", borderRadius: 12,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Payment</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: order.paymentStatus === "completed" ? "#4ADE80" : "rgba(255,255,255,0.8)",
                      textTransform: "capitalize",
                    }}>
                      {order.paymentStatus === "completed"
                        ? "Paid"
                        : order.paymentMethod === "cod"
                        ? "Pay on Delivery"
                        : order.paymentStatus}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Seller info */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: "white", borderRadius: 20, border: B, overflow: "hidden" }}
              >
                <div style={{ padding: "18px 20px", borderBottom: B }}>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: M }}>
                    Sold by
                  </p>
                </div>

                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: S, border: B,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Store size={16} color={N} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: N, margin: 0 }}>{storeName}</p>
                      <p style={{ fontSize: 11, color: M, margin: "2px 0 0" }}>Verified Seller</p>
                    </div>
                  </div>
                  <ChevronRight size={14} color={M} />
                </div>
              </motion.div>

              {/* Need help */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  borderRadius: 20, border: B,
                  background: "white", overflow: "hidden",
                }}
              >
                <div style={{ padding: "18px 20px", borderBottom: B }}>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: M }}>
                    Need help?
                  </p>
                </div>

                {[
                  { label: "Track shipment",   sub: "View courier details" },
                  { label: "Return / Refund",  sub: "Raise a return request" },
                  { label: "Contact support",  sub: "We reply within 2 hrs" },
                ].map(({ label, sub }, i, arr) => (
                  <button
                    key={label}
                    style={{
                      width: "100%", padding: "14px 20px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "none", border: "none", cursor: "pointer",
                      borderBottom: i < arr.length - 1 ? "1px solid #F7F8FC" : "none",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = S)}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 10, color: M, margin: "2px 0 0" }}>{sub}</p>
                    </div>
                    <ChevronRight size={13} color={M} />
                  </button>
                ))}
              </motion.div>

              {/* Expected delivery */}
              {order.status !== "delivered" && order.status !== "cancelled" && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    borderRadius: 20, border: "1px solid #BBF7D0",
                    background: "#F0FDF4", padding: "18px 20px",
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: "#059669", marginBottom: 8 }}>
                    Expected Delivery
                  </p>
                  <p style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 20, color: N, margin: 0,
                  }}>
                    {new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                  </p>
                  <p style={{ fontSize: 11, color: "#059669", marginTop: 4, fontWeight: 600 }}>
                    3–5 business days from dispatch
                  </p>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}