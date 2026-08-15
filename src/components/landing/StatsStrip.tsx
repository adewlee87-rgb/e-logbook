"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CountUp } from "@/components/landing/motion";

const STATS = [
  { end: 20, prefix: "", suffix: "+", label: "Universities onboarding" },
  { end: 12000, prefix: "", suffix: "+", label: "Students logging" },
  { end: 480000, prefix: "", suffix: "+", label: "Entries recorded" },
  { end: 24, prefix: "< ", suffix: " hrs", label: "Avg. approval turnaround" },
];

export function StatsStrip() {
  const reduce = useReducedMotion();

  return (
    <div className="border-y border-[#E5E7EB] bg-[#FAFAFA]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <CountUp
                end={stat.end}
                prefix={stat.prefix}
                suffix={stat.suffix}
                className="text-3xl font-bold text-[#1A1A1A] sm:text-4xl"
              />
              <div className="mt-1 text-sm text-[#666]">{stat.label}</div>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-[#9CA3AF]">
          Illustrative figures shown for demonstration.
        </p>
      </div>
    </div>
  );
}
