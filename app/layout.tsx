import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/providers/AuthProvider";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/ui/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReeCommerce | Experience Shopping in Motion",
  description: "The next generation of social commerce driven by vertical video reels.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-white antialiased`}>
        <AuthProvider>
          {/* 
            CartProvider is placed inside AuthProvider because 
            it needs to know if a user is logged in to sync with MongoDB.
          */}
          <CartProvider>
            
            {/* The Navbar now handles its own visibility logic internally */}
            <Navbar />
            
            {/* 
               We removed 'container mx-auto' from here because 
               the Immersive Reel Viewer and Dashboard need full-width access.
               We handle padding inside individual pages for better control.
            */}
            <main className="relative min-h-screen">
              {children}
            </main>

          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}