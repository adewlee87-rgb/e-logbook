"use client";

import { useEffect, useState } from "react";

interface WelcomeHeaderProps {
  firstName: string;
  createdAt: string;
  userId?: string;
}

export function WelcomeHeader({ firstName, createdAt, userId }: WelcomeHeaderProps) {
  const [isNewUserCelebration, setIsNewUserCelebration] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [showRibbons, setShowRibbons] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = `yello_welcome_seen_${userId || firstName}`;
    const hasSeen = localStorage.getItem(storageKey);

    const createdTime = new Date(createdAt).getTime();
    const now = Date.now();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const createdWithinHour = !isNaN(createdTime) && now - createdTime < ONE_HOUR_MS;

    // Only run celebration if user was created within 1 hour AND has not seen it yet
    if (createdWithinHour && !hasSeen) {
      setIsNewUserCelebration(true);
      setShowRibbons(true);
      localStorage.setItem(storageKey, "true");

      const ribbonTimer = setTimeout(() => {
        setShowRibbons(false);
      }, 20000); // 20-second pour-down animation

      const fullText = `Welcome, ${firstName}!`;
      let currentIdx = 0;

      const typingInterval = setInterval(() => {
        if (currentIdx <= fullText.length) {
          setTypedName(fullText.slice(0, currentIdx));
          currentIdx++;
        } else {
          clearInterval(typingInterval);
        }
      }, 70);

      return () => {
        clearTimeout(ribbonTimer);
        clearInterval(typingInterval);
      };
    } else {
      setIsNewUserCelebration(false);
      setShowRibbons(false);
    }
  }, [createdAt, firstName, userId]);

  return (
    <div className="relative">
      {/* 20-Second One-Time Cascade Ribbon Overlay (Black, Grey, Red, Yellow) - NEVER shown on Welcome Back */}
      {isNewUserCelebration && showRibbons && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 45 }).map((_, i) => {
            const leftPos = (i * 2.2 + Math.random() * 2) % 100;
            const delay = (i * 0.12) % 4;
            const duration = 3.2 + (i % 3);
            const width = 8 + (i % 8);
            const height = 24 + (i % 30);

            // Specified brand colors: Black, Grey, Red, Yellow
            const BRAND_COLORS = [
              "#1A1A1A", // Black
              "#6B7280", // Grey
              "#EF4444", // Red
              "#FFC107", // Yellow
            ];
            const bg = BRAND_COLORS[i % BRAND_COLORS.length];

            return (
              <div
                key={i}
                className="absolute -top-12 rounded-sm opacity-90 shadow-sm"
                style={{
                  left: `${leftPos}%`,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: bg,
                  animationName: "ribbonDrop",
                  animationDuration: `${duration}s`,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {isNewUserCelebration ? (
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3D6] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#B45309]">
            ✨ Welcome to Y&apos;ello Log
          </span>
          <h2 className="mt-1.5 text-3xl font-extrabold text-[#1A1A1A] sm:text-4xl">
            <span>{typedName}</span>
            <span className="inline-block animate-pulse text-[#FFC107] font-bold ml-0.5">|</span>
          </h2>
        </div>
      ) : (
        <div>
          <p className="text-[#666]">Welcome Back,</p>
          <h2 className="text-3xl font-bold text-[#1A1A1A]">{firstName}</h2>
        </div>
      )}
    </div>
  );
}
