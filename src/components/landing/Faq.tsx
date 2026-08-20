"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";
import { ChevronDownIcon } from "@/components/ui/icons";

const FAQS = [
  {
    q: "How do students log in?",
    a: "Students sign in with their E-mail and a password — no email required. The E-mail is what identifies them across the platform.",
  },
  {
    q: "Can students attach photo evidence?",
    a: "Yes. Every entry can carry photos and files uploaded straight from a phone, so the work is backed by proof, not just a written claim.",
  },
  {
    q: "Is our data safe?",
    a: "Entries and media are stored securely in the cloud with access controlled by role — students, supervisors, and admins each see only what they should.",
  },

  {
    q: "Does it work on phones?",
    a: "Fully. Y'ello Log is responsive and built mobile-first, so students can log activities from any phone while they’re on placement.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white transition-colors hover:border-primary/40">
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-semibold text-[#1A1A1A] sm:text-base">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 text-[#666]"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            key="content"
            initial={reduce ? undefined : { height: 0, opacity: 0 }}
            animate={reduce ? undefined : { height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-[#666]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <Section id="faq">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-[#666]">
          Everything students and institutions usually ask before getting
          started.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-3">
        {FAQS.map((faq, i) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
        ))}
      </div>
    </Section>
  );
}
