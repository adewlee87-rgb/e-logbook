"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";

const PROBLEMS = [
  "Logbooks get lost, damaged, or forgotten before assessment.",
  "Entries are written from memory at the end of term.",
  "Supervisors can't verify what actually happened, or when.",
  "ITF has no reliable oversight across schools and placements.",
];

const SHIFTS = [
  "Entries logged daily, timestamped, and safely stored online.",
  "Photo and file evidence attached to every activity.",
  "Supervisors review and stamp work as it happens.",
  "ITF officials get verifiable, auditable records at a glance.",
];

const EASE = [0.22, 1, 0.36, 1] as const;

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M4 10.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const listParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};
const listItem = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } },
};

export function ProblemShift() {
  const reduce = useReducedMotion();

  return (
    <Section id="why" className="!py-16 sm:!py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          The paper logbook is holding students back
        </h2>
        <p className="mt-4 text-[#666]">
          SIWES matters — but the way it&apos;s recorded hasn&apos;t changed in
          decades. Y&apos;ello Log fixes that.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Problem */}
        <motion.div
          className="rounded-2xl border border-[#E5E7EB] bg-white p-8"
          initial={reduce ? false : { opacity: 0, x: -24 }}
          whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-semibold text-[#DC2626]">
            The old way
          </span>
          <h3 className="mt-4 text-xl font-bold text-[#1A1A1A]">
            Paper logbooks
          </h3>
          <motion.ul
            className="mt-6 space-y-4"
            variants={reduce ? undefined : listParent}
            initial={reduce ? false : "hidden"}
            whileInView={reduce ? undefined : "visible"}
            viewport={{ once: true, margin: "-80px" }}
          >
            {PROBLEMS.map((item) => (
              <motion.li
                key={item}
                variants={listItem}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]">
                  <CrossIcon />
                </span>
                <span className="text-sm text-[#333]">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Shift */}
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-8"
          initial={reduce ? false : { opacity: 0, x: 24 }}
          whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#16A34A]">
            The Y&apos;ello Log way
          </span>
          <h3 className="mt-4 text-xl font-bold text-[#1A1A1A]">
            A living digital record
          </h3>
          <motion.ul
            className="mt-6 space-y-4"
            variants={reduce ? undefined : listParent}
            initial={reduce ? false : "hidden"}
            whileInView={reduce ? undefined : "visible"}
            viewport={{ once: true, margin: "-80px" }}
          >
            {SHIFTS.map((item) => (
              <motion.li
                key={item}
                variants={listItem}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                  <CheckIcon />
                </span>
                <span className="text-sm text-[#333]">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* Supporting image band */}
      <Reveal className="mt-6" y={16}>
        <div className="relative aspect-[16/6] overflow-hidden rounded-2xl border border-[#E5E7EB]">
          <Image
            src="/auth/onboarding-3.jpg"
            alt="Students collaborating during industrial training"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Reveal>
    </Section>
  );
}
