"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";
import { ProfileIcon, ReportIcon, SettingsIcon } from "@/components/ui/icons";

interface Role {
  icon: ReactNode;
  name: string;
  tagline: string;
  points: string[];
}

const ROLES: Role[] = [
  {
    icon: <ProfileIcon className="h-5 w-5" />,
    name: "Student",
    tagline: "Owns the logbook",
    points: [
      "Create, edit and submit log entries",
      "Attach photo & file evidence",
      "Track progress and export reports",
    ],
  },
  {
    icon: <BadgeCheckIconLocal />,
    name: "Supervisor",
    tagline: "Verifies the work",
    points: [
      "Review assigned students' entries",
      "Comment, approve or reject",
      "Stamp logs as they happen",
    ],
  },
  {
    icon: <ReportIcon className="h-5 w-5" />,
    name: "ITF Official",
    tagline: "Provides oversight",
    points: [
      "View approved entries across students",
      "Add official comments",
      "Verify training at a glance",
    ],
  },
  {
    icon: <SettingsIcon className="h-5 w-5" />,
    name: "Admin",
    tagline: "Runs the platform",
    points: [
      "Manage users and profiles",
      "Assign supervisors to students",
      "See platform-wide statistics",
    ],
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const gridParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

// Local inline badge-check to avoid a naming clash while keeping the icon set consistent.
function BadgeCheckIconLocal() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2l2.4 1.8 3 .3 .9 2.9 2.4 1.9-1 2.9 1 2.9-2.4 1.9-.9 2.9-3 .3L12 22l-2.4-1.8-3-.3-.9-2.9L3.3 15l1-2.9-1-2.9 2.4-1.9.9-2.9 3-.3L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Roles() {
  const reduce = useReducedMotion();

  return (
    <Section id="roles" className="!py-16 sm:!py-24">
      <div className="relative overflow-hidden rounded-3xl bg-[#1A1A1A] px-6 py-14 sm:px-12">
        {/* Animated grid + aurora inside the dark panel */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="bg-grid absolute inset-0 opacity-60" />
          <div className="animate-aurora absolute -right-10 -top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div
            className="animate-aurora absolute bottom-0 left-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
            style={{ animationDelay: "-8s" }}
          />
        </div>

        <div className="relative">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built for every role
            </h2>
            <p className="mt-4 text-white/70">
              One platform that serves the whole training chain — from the student
              on placement to the officials who sign off.
            </p>
          </Reveal>

          <motion.div
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variants={reduce ? undefined : gridParent}
            initial={reduce ? false : "hidden"}
            whileInView={reduce ? undefined : "visible"}
            viewport={{ once: true, margin: "-80px" }}
          >
            {ROLES.map((role) => (
              <motion.div
                key={role.name}
                variants={cardVariant}
                whileHover={reduce ? undefined : { y: -6, borderColor: "rgba(255,193,7,0.5)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <motion.span
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-[#1A1A1A]"
                  whileHover={reduce ? undefined : { rotate: -8, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                >
                  {role.icon}
                </motion.span>
                <h3 className="mt-4 text-lg font-bold text-white">{role.name}</h3>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {role.tagline}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-white/80">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
