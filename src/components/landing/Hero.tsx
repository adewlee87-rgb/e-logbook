"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { BadgeCheckIcon } from "@/components/ui/icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Decorative parallax only — never on text.
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);
  const badgeY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  return (
    <div ref={ref} className="relative overflow-hidden">
      {/* Ambient aurora + texture (decorative, GPU-only) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-dots opacity-70" />
        <div className="animate-aurora absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div
          className="animate-aurora absolute -right-16 top-24 h-96 w-96 rounded-full bg-[#FDE68A]/40 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="animate-aurora absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#FCD34D]/30 blur-3xl"
          style={{ animationDelay: "-11s" }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <motion.div
            variants={reduce ? undefined : container}
            initial={reduce ? false : "hidden"}
            animate={reduce ? undefined : "visible"}
          >
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white/80 px-4 py-1.5 text-xs font-medium text-[#666] backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Built for SIWES industrial training
            </motion.span>

            <motion.h1
              variants={item}
              className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-[#1A1A1A] sm:text-5xl lg:text-6xl"
            >
              Retire the paper logbook.
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 max-w-xl text-base leading-relaxed text-[#666] sm:text-lg"
            >
              Y&apos;ello Log digitizes the Universal E-Logbook for Nigerian
              universities. Students record daily training activities with photo
              evidence, and supervisors review and stamp them — all in one
              place.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <motion.div
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/signup"
                  className="block rounded-full bg-primary px-7 py-3.5 text-center text-sm font-semibold text-[#1A1A1A] shadow-lg shadow-primary/30 transition-colors hover:bg-[#e6ac00]"
                >
                  Get started
                </Link>
              </motion.div>
            </motion.div>

            <motion.p variants={item} className="mt-6 text-sm text-[#9CA3AF]">
              Log in with your matric number · Works on any phone · No paperwork
            </motion.p>
          </motion.div>

          {/* Visual */}
          <motion.div
            className="relative"
            style={{ y: imageY }}
            initial={reduce ? false : { opacity: 0, scale: 0.94, y: 30 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
          >
            {/* Animated gradient glow ring behind the frame */}
            <div
              aria-hidden
              className="animate-border-pan absolute -inset-3 -z-10 rounded-[1.75rem] opacity-70 blur-md"
              style={{
                background:
                  "linear-gradient(120deg, #FFC107, #FDE68A, #FCD34D, #FFC107)",
                backgroundSize: "200% 200%",
              }}
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-xl">
              <Image
                src="/auth/yello-log-one.jpeg"
                alt="A student documenting their industrial training work"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Shimmer sweep */}
              <div
                aria-hidden
                className="shimmer pointer-events-none absolute inset-0"
              />
            </div>

            {/* Floating stamped badge */}
            <motion.div
              style={{ y: badgeY }}
              className="animate-float absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white/95 p-4 shadow-lg backdrop-blur"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                <BadgeCheckIcon className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-[#1A1A1A]">
                  Log approved
                </div>
                <div className="text-xs text-[#666]">
                  Stamped by your supervisor
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
