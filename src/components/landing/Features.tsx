"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";
import {
  BadgeCheckIcon,
  BellIcon,
  CalendarCheckIcon,
  CameraIcon,
  DownloadIcon,
  HourglassIcon,
  ReportIcon,
  StopwatchIcon,
} from "@/components/ui/icons";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: <CameraIcon className="h-5 w-5" />,
    title: "Photo & file evidence",
    description:
      "Attach photos and documents straight from your phone as proof of the work you did.",
  },
  {
    icon: <BadgeCheckIcon className="h-5 w-5" />,
    title: "Supervisor review & stamping",
    description:
      "Supervisors approve or send back entries with comments — your record is verified, not just claimed.",
  },
  {
    icon: <BellIcon className="h-5 w-5" />,
    title: "Stamped-log notifications",
    description:
      "Get notified the moment a supervisor approves or rejects one of your logs.",
  },
  {
    icon: <StopwatchIcon className="h-5 w-5" />,
    title: "Progress tracker",
    description:
      "A visual tracker shows your active days across the full internship duration at a glance.",
  },
  {
    icon: <DownloadIcon className="h-5 w-5" />,
    title: "Downloadable reports",
    description:
      "Export your logbook entries to share or keep — no more transcribing by hand.",
  },
  {
    icon: <HourglassIcon className="h-5 w-5" />,
    title: "Completion at a glance",
    description:
      "Track total submissions, days completed, and how far along your placement you are.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const gridParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Features() {
  const reduce = useReducedMotion();

  return (
    <Section id="features">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          Everything your logbook needs
        </h2>
        <p className="mt-4 text-[#666]">
          From the first entry to the final report, Y'ello Log covers the whole
          SIWES workflow for students, supervisors, and ITF.
        </p>
      </Reveal>

      <motion.div
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        variants={reduce ? undefined : gridParent}
        initial={reduce ? false : "hidden"}
        whileInView={reduce ? undefined : "visible"}
        viewport={{ once: true, margin: "-80px" }}
      >
        {FEATURES.map((feature) => (
          <motion.div
            key={feature.title}
            variants={cardVariant}
            whileHover={reduce ? undefined : { y: -6 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group rounded-2xl border border-[#E5E7EB] bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-primary/10"
          >
            <motion.span
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3D6] text-[#1A1A1A]"
              whileHover={reduce ? undefined : { rotate: -8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
            >
              {feature.icon}
            </motion.span>
            <h3 className="mt-4 text-base font-semibold text-[#1A1A1A]">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#666]">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
