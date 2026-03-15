"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Phone, User, Home, ArrowLeft,
  ShieldCheck, Loader2, CreditCard, Banknote,
  CheckCircle2, Zap, Package, Lock,
  Truck, RotateCcw, ShoppingBag,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────
const N = "#0A1628";
const M = "#9BA8C0";
const B = "1px solid #E4E9F2";
const S = "#F7F8FC";

// ─── Razorpay SDK loader ─────────────────────────────────────────
const loadRazorpay = () =>
  new Promise<boolean>(resolve => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const fmtRupee = (n: number) => `\u20b9${n.toLocaleString("en-IN")}`;

// ─── Field ────────────────────────────────────────────────────────
function Field({
  icon: Icon, placeholder, value, onChange,
  required, type = "text", error,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  onChange: (v: string) => void; required?: boolean;
  type?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <Icon
          size={14}
          color={focused ? N : error ? "#DC2626" : M}
          style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", pointerEvents: "none",
            transition: "color .15s",
          }}
        />
        <input
          type={type} required={required}
          placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "13px 14px 13px 38px",
            borderRadius: 12, fontFamily: "DM Sans, sans-serif",
            fontSize: 13, color: N, outline: "none",
            boxSizing: "border-box", transition: "all .15s",
            background: focused ? "white" : error ? "#FFF1F2" : S,
            border: focused
              ? `2px solid ${N}`
              : error
              ? "2px solid #DC2626"
              : "2px solid #E4E9F2",
          }}
        />
      </div>
      {error && (
        <p style={{ fontSize: 10, color: "#DC2626", fontWeight: 700, margin: "4px 0 0 4px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────
function SCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "white", border: B, borderRadius: 22,
      padding: "28px", boxShadow: "0 1px 4px rgba(10,22,40,0.04)", ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────
function SHeader({ step, icon: Icon, title }: { step: number; icon: React.ElementType; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: N,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={16} color="white" />
      </div>
      <div>
        <p style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: 0 }}>
          Step {step}
        </p>
        <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 20, color: N, margin: 0, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
      </div>
    </div>
  );
}

// ─── Payment option ───────────────────────────────────────────────
function PayOption({ icon: Icon, title, sub, selected, onClick }: {
  icon: React.ElementType; title: string; sub: string;
  selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px", borderRadius: 16,
        border: selected ? `2px solid ${N}` : "2px solid #E4E9F2",
        background: selected ? "#F0F2F7" : S,
        cursor: "pointer", textAlign: "left", width: "100%",
        transition: "all .18s",
        boxShadow: selected ? "0 4px 16px rgba(10,22,40,0.1)" : "none",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: selected ? N : "#E4E9F2",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background .18s",
      }}>
        <Icon size={18} color={selected ? "white" : M} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: N, margin: 0, fontFamily: "DM Sans, sans-serif" }}>{title}</p>
        <p style={{ fontSize: 9, fontWeight: 700, color: M, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{sub}</p>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <CheckCircle2 size={18} color="#059669" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Trust badge ──────────────────────────────────────────────────
const TrustBadge = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <Icon size={12} color="rgba(255,255,255,0.35)" />
    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
      {label}
    </span>
  </div>
);

// ─── Error toast ─────────────────────────────────────────────────
function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
        zIndex: 9999, padding: "14px 20px", borderRadius: 14,
        background: "#1a0a0a", border: "1px solid #3d1515",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        maxWidth: "90vw", width: 440,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: "#FFF1F2",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Package size={14} color="#DC2626" />
      </div>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "white", margin: 0, lineHeight: 1.4 }}>
        {message}
      </p>
      <button
        onClick={onClose}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}
      >
        &times;
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
export default function CheckoutPage() {
  const { items, cartTotal, shippingAddress, setShippingAddress, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading,      setLoading]      = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"placing" | "verifying" | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
  const [address,      setAddress]      = useState(
    shippingAddress || { fullName: "", phone: "", street: "", city: "", state: "", zipCode: "" }
  );

  // ── Empty cart guard ──────────────────────────────────────────
  if (!items || items.length === 0) {
    return (
      <div style={{
        minHeight: "80vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: S, fontFamily: "DM Sans, sans-serif", padding: 24, textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: "white", border: B,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        }}>
          <ShoppingBag size={28} color={M} />
        </div>
        <h2 style={{ fontFamily: "Instrument Serif, serif", fontSize: 26, color: N, margin: "0 0 8px" }}>
          Your bag is empty
        </h2>
        <p style={{ fontSize: 14, color: M, margin: "0 0 24px" }}>Add some items before checking out.</p>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "13px 24px", borderRadius: 14, background: N,
            color: "white", border: "none", fontWeight: 800,
            cursor: "pointer", fontSize: 14, fontFamily: "DM Sans, sans-serif",
          }}
        >
          <ShoppingBag size={15} /> Browse Products
        </button>
      </div>
    );
  }

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!address.fullName.trim())                    e.fullName = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) e.phone    = "Enter a valid 10-digit mobile number";
    if (!address.street.trim())                      e.street   = "Address is required";
    if (!address.city.trim())                        e.city     = "City is required";
    if (!address.state.trim())                       e.state    = "State is required";
    if (!/^\d{6}$/.test(address.zipCode.trim()))     e.zipCode  = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setLoading(false);
    setLoadingPhase("");
  };

  // ── COD flow ──────────────────────────────────────────────────
  const handleCOD = async () => {
    setLoadingPhase("placing");
    try {
      const res  = await fetch("/api/checkout/cod", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.error || "COD order failed"); return; }
      clearCart();
      router.push(`/checkout/success?method=cod${data.orderId ? `&orderId=${data.orderId}` : ""}`);
    } catch {
      showError("Network error. Please try again.");
    }
  };

  // ── Online / Razorpay flow ────────────────────────────────────
  //
  // IMPORTANT: The Razorpay `handler` callback fires asynchronously
  // AFTER the outer try/catch has already resolved (rzp.open() returns
  // synchronously). This means:
  //   1. `handler` must manage its own loading state — setLoading(false)
  //      is NOT called in a finally block here.
  //   2. Errors inside `handler` must call showError(), not throw.
  //   3. modal.ondismiss handles the case where the user closes the modal.
  //   4. rzp.on("payment.failed") handles card/UPI declines — no throwing.
  //
  const handleOnline = async () => {
    setLoadingPhase("placing");

    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) { showError("Razorpay failed to load. Check your connection."); return; }

    const orderRes  = await fetch("/api/checkout/create", { method: "POST" });
    const orderData = await orderRes.json();
    if (!orderRes.ok) { showError(orderData.error || "Could not create order"); return; }

    // Outer loading ends here — Razorpay modal takes over the UI.
    // Do NOT put setLoading(false) in a finally — it would fire right
    // after rzp.open() returns, while the modal is still open.
    setLoading(false);
    setLoadingPhase("");

    const options = {
      key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount:      orderData.amount,
      currency:    orderData.currency,
      name:        "ReeCommerce",
      description: "Order Payment",
      order_id:    orderData.id,

      // Fires after Razorpay confirms payment on their end.
      // Must be self-contained — no outer try/catch wraps this.
      handler: async (response: {
        razorpay_order_id:   string;
        razorpay_payment_id: string;
        razorpay_signature:  string;
      }) => {
        setLoading(true);
        setLoadingPhase("verifying");

        try {
          const verifyRes = await fetch("/api/checkout/verify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            // Explicitly list each field — do NOT spread the full response object.
            // Spreading can include extra Razorpay-internal fields that may shift
            // the body shape and cause address validation to fail on the server.
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              address,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            // Payment went through on Razorpay but our server rejected it.
            // Do NOT clear cart — buyer may need to contact support.
            const isSignatureMismatch = verifyData.error === "Payment verification failed";
            showError(
              isSignatureMismatch
                ? `Signature verification failed. Please contact support with payment ID: ${response.razorpay_payment_id}`
                : verifyData.error || "Order creation failed. Please contact support."
            );
            return;
          }

          clearCart();
          router.push(
            `/checkout/success?method=online${verifyData.orderId ? `&orderId=${verifyData.orderId}` : ""}`
          );
        } catch {
          showError(
            "Verification request failed. If money was deducted, please contact support with payment ID: " +
            response.razorpay_payment_id
          );
        }
      },

      modal: {
        // User pressed the X on the Razorpay modal without paying
        ondismiss: () => {
          setLoading(false);
          setLoadingPhase("");
        },
      },

      prefill: {
        name:    address.fullName,
        contact: address.phone,
        email:   session?.user?.email ?? "",
      },
      theme: { color: N },
    };

    const rzp = new (window as any).Razorpay(options);

    // Card declined, UPI timeout, etc. — do NOT throw here, it's unhandled
    rzp.on("payment.failed", (failResponse: any) => {
      setLoading(false);
      setLoadingPhase("");
      showError(failResponse.error?.description || "Payment failed. Please try a different method.");
    });

    rzp.open();
  };

  // ── Form submit ───────────────────────────────────────────────
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrorMsg(null);
    setShippingAddress(address);
    if (paymentMethod === "cod") await handleCOD();
    else await handleOnline();
  };

  const loadingLabel =
    loadingPhase === "verifying" ? "Verifying payment\u2026" :
    loadingPhase === "placing"   ? "Placing order\u2026"     : "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800;9..40,900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: S, paddingBottom: 80, fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px 0" }}>

          {/* Back */}
          <button
            onClick={() => router.back()}
            style={{
              display: "flex", alignItems: "center", gap: 7, marginBottom: 28,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: M,
              fontFamily: "DM Sans, sans-serif", padding: 0, transition: "color .15s",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = N)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = M)}
          >
            <ArrowLeft size={16} /> Back to Bag
          </button>

          {/* Page title */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "Instrument Serif, serif", fontSize: 32, color: N, margin: 0, letterSpacing: "-0.025em" }}>
              Checkout
            </h1>
            <p style={{ fontSize: 12, color: M, margin: "4px 0 0" }}>
              {items.length} item{items.length !== 1 ? "s" : ""} &middot; {fmtRupee(cartTotal)} total
            </p>
          </div>

          <form onSubmit={handleProcessOrder}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,380px)", gap: 24, alignItems: "start" }}>

              {/* ── Left column ────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Step 1 — Address */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SCard>
                    <SHeader step={1} icon={MapPin} title="Delivery Address" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <Field icon={User}  placeholder="Full Name"             value={address.fullName} onChange={v => setAddress({ ...address, fullName: v })} required error={errors.fullName} />
                      <Field icon={Phone} placeholder="Mobile Number"         value={address.phone}    onChange={v => setAddress({ ...address, phone: v })}    required type="tel" error={errors.phone} />
                      <Field icon={Home}  placeholder="Flat / Street / Area"  value={address.street}   onChange={v => setAddress({ ...address, street: v })}   required error={errors.street} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field icon={MapPin} placeholder="City"  value={address.city}  onChange={v => setAddress({ ...address, city: v })}  required error={errors.city} />
                        <Field icon={MapPin} placeholder="State" value={address.state} onChange={v => setAddress({ ...address, state: v })} required error={errors.state} />
                      </div>
                      <Field icon={MapPin} placeholder="Pincode (6 digits)" value={address.zipCode} onChange={v => setAddress({ ...address, zipCode: v })} required error={errors.zipCode} />
                    </div>
                  </SCard>
                </motion.div>

                {/* Step 2 — Payment */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SCard>
                    <SHeader step={2} icon={CreditCard} title="Payment Method" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <PayOption icon={Zap}      title="Pay Online"        sub="UPI \u00b7 Cards \u00b7 Wallets \u00b7 Net Banking" selected={paymentMethod === "online"} onClick={() => setPaymentMethod("online")} />
                      <PayOption icon={Banknote} title="Cash on Delivery"  sub="Pay at your doorstep"                              selected={paymentMethod === "cod"}    onClick={() => setPaymentMethod("cod")}    />
                    </div>

                    <AnimatePresence>
                      {paymentMethod === "online" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                          style={{ overflow: "hidden", marginTop: 14 }}
                        >
                          <div style={{ padding: "12px 14px", borderRadius: 12, background: "#F0FDF4", border: "1px solid #BBF7D0", display: "flex", alignItems: "center", gap: 8 }}>
                            <Lock size={12} color="#059669" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#059669" }}>
                              Secured by Razorpay &mdash; 256-bit SSL encryption
                            </span>
                          </div>
                        </motion.div>
                      )}
                      {paymentMethod === "cod" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                          style={{ overflow: "hidden", marginTop: 14 }}
                        >
                          <div style={{ padding: "12px 14px", borderRadius: 12, background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: 8 }}>
                            <Banknote size={12} color="#D97706" />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706" }}>
                              Keep exact change ready at time of delivery
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SCard>
                </motion.div>
              </div>

              {/* ── Right column ─────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: "sticky", top: 90, display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Order summary card */}
                <div style={{
                  background: N, borderRadius: 22, padding: "28px 26px",
                  boxShadow: "0 16px 48px rgba(10,22,40,0.22)",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Dot grid texture */}
                  <div style={{
                    position: "absolute", inset: 0, opacity: 0.04,
                    backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                    backgroundSize: "16px 16px", pointerEvents: "none",
                  }} />

                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "rgba(255,255,255,0.35)", margin: "0 0 20px", position: "relative" }}>
                    Order Summary
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 18, marginBottom: 18, position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                        Subtotal ({items.length} items)
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{fmtRupee(cartTotal)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Delivery</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#4ADE80" }}>FREE</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22, position: "relative" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Payable Amount</span>
                    <span style={{ fontFamily: "Instrument Serif, serif", fontSize: 32, color: "white", letterSpacing: "-0.02em" }}>
                      {fmtRupee(cartTotal)}
                    </span>
                  </div>

                  {/* CTA button */}
                  <button
                    type="submit" disabled={loading}
                    style={{
                      width: "100%", padding: "16px", borderRadius: 16,
                      background: loading ? "rgba(255,255,255,0.12)" : "white",
                      border: "none",
                      color: loading ? "rgba(255,255,255,0.4)" : N,
                      fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: "DM Sans, sans-serif",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      transition: "all .18s",
                      boxShadow: loading ? "none" : "0 4px 16px rgba(255,255,255,0.15)",
                      position: "relative",
                    }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget.style.transform = "translateY(-1px)"); }}
                    onMouseLeave={e => { (e.currentTarget.style.transform = "translateY(0)"); }}
                  >
                    {loading ? (
                      <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> {loadingLabel}</>
                    ) : paymentMethod === "online" ? (
                      <><Lock size={15} /> Pay {fmtRupee(cartTotal)}</>
                    ) : (
                      <><Package size={15} /> Place COD Order</>
                    )}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 18, position: "relative", flexWrap: "wrap" }}>
                    <TrustBadge icon={ShieldCheck} label="Secure" />
                    <TrustBadge icon={Truck}       label="Free Delivery" />
                    <TrustBadge icon={RotateCcw}   label="Easy Returns" />
                  </div>
                </div>

                {/* Cart preview */}
                <SCard style={{ padding: "20px" }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: M, margin: "0 0 14px" }}>
                    {items.length} item{items.length !== 1 ? "s" : ""} in your bag
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((item: any) => (
                      <div key={item.productId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", borderRadius: 14, background: S, border: B }}>
                        <div style={{ position: "relative", width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "white", border: B, flexShrink: 0 }}>
                          {item.imageUrl && (
                            <Image src={item.imageUrl} alt={item.name} fill style={{ objectFit: "cover" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: N, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: 10, color: M, margin: "2px 0 0" }}>
                            {item.quantity} &times; {fmtRupee(item.price)}
                          </p>
                        </div>
                        <p style={{ fontFamily: "Instrument Serif, serif", fontSize: 15, color: N, margin: 0, flexShrink: 0 }}>
                          {fmtRupee(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </SCard>

                {/* Delivery promises */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[
                    { icon: Truck,       label: "Free delivery"   },
                    { icon: RotateCcw,   label: "7-day returns"   },
                    { icon: ShieldCheck, label: "Buyer protected" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", gap: 7, padding: "10px 12px", borderRadius: 12, background: "white", border: B }}>
                      <Icon size={13} color="#059669" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#6B7A99" }}>{label}</span>
                    </div>
                  ))}
                </div>

              </motion.div>
            </div>
          </form>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />}
      </AnimatePresence>
    </>
  );
}