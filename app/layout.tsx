import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/providers/AuthProvider";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/ui/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents pinch-zoom from breaking the "Floating iPhone" / Reel UI
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  title: "ReeCommerce | The Cinematic Commerce Vault",
  description: "Architecting the next dimension of social commerce. Immerse in high-fidelity vertical retail experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body 
        className={`${inter.className} bg-[#FFFFFF] text-[#0F172A] antialiased min-h-screen flex flex-col overscroll-none selection:bg-slate-200 selection:text-[#0F172A]`}
      >
        <AuthProvider>
          {/* 
            CartProvider syncs the user's commerce vault with MongoDB 
            upon successful authentication handshake. 
          */}
          <CartProvider>
            
            <Navbar />
            
            {/* 
               Unbound container to allow immersive Edge-to-Edge Reel viewing 
               and expansive Bento Grid dashboard layouts. 
            */}
            <main className="relative flex-1 w-full flex flex-col overflow-x-hidden">
              {children}
            </main>

          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}