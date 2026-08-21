"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center sm:px-12 sm:py-20"
        initial={reduce ? false : { opacity: 0, y: 30, scale: 0.98 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Sweeping light sheen + grid texture (decorative) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="shimmer absolute inset-0 opacity-40" />
          <div className="animate-aurora absolute -right-10 -top-16 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        </div>

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
            Start your digital logbook today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#1A1A1A]/70">
            Join the students and institutions moving SIWES off paper and into a
            verifiable, modern record.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <motion.div
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/signup"
                className="block rounded-full bg-[#1A1A1A] px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition-colors hover:bg-black"
              >
                Get started
              </Link>
            </motion.div>
            {/* <motion.div whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="block rounded-full border border-[#1A1A1A]/20 bg-white px-7 py-3.5 text-center text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-white/70"
              >
                Request access for your institution
              </Link>
            </motion.div> */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
