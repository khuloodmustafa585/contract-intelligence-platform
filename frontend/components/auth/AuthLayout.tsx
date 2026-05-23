"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: "#040b1c" }}
    >
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, -28, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-15%",
            left: "35%",
            width: 700,
            height: 500,
            background: "radial-gradient(ellipse, rgba(99,102,241,0.16) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <motion.div
          animate={{ y: [0, 22, 0], opacity: [0.2, 0.38, 0.2] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{
            position: "absolute",
            bottom: "5%",
            right: "10%",
            width: 450,
            height: 380,
            background: "radial-gradient(ellipse, rgba(34,211,238,0.09) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 10%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black 10%, transparent 100%)",
          }}
        />
      </div>

      {/* Content slot */}
      <div className="relative z-10 w-full flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
