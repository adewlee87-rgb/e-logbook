"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";

const STEPS = [
  {
    number: "01",
    title: "Sign up with your matric number",
    description:
      "Create your account using your matric number and set a password — no long forms.",
  },
  {
    number: "02",
    title: "Log activities with evidence",
    description:
      "Record what you did each day and attach photos or files as proof of your work.",
  },
  {
    number: "03",
    title: "Supervisor reviews & stamps",
    description:
      "Your supervisor reviews entries, leaves comments, and approves or sends them back.",
  },
  {
    number: "04",
    title: "Track progress & export",
    description:
      "Watch your completion grow on the tracker, then download your report when you're done.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const gridParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.1 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <Section id="how-it-works">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          How it works
        </h2>
        <p className="mt-4 text-[#666]">
          From sign-up to a verified, exportable logbook in four simple steps.
        </p>
      </Reveal>

      <div className="relative mt-12">
        {/* Animated dashed connector (desktop only, decorative) */}
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-6 hidden w-full lg:block"
          height="2"
          preserveAspectRatio="none"
          viewBox="0 0 100 2"
        >
          <motion.line
            x1="6"
            y1="1"
            x2="94"
            y2="1"
            stroke="#FFC107"
            strokeWidth="2"
            strokeDasharray="4 4"
            initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
        </svg>

        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={reduce ? undefined : gridParent}
          initial={reduce ? false : "hidden"}
          whileInView={reduce ? undefined : "visible"}
          viewport={{ once: true, margin: "-80px" }}
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={cardVariant}
              whileHover={reduce ? undefined : { y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative rounded-2xl border border-[#E5E7EB] bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-primary/10"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-[#1A1A1A]">
                {step.number}
              </span>
              <h3 className="mt-4 text-base font-semibold text-[#1A1A1A]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
