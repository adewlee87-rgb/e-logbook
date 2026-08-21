"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/landing/Section";
import { Reveal } from "@/components/landing/motion";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  StatusBadge,
  type EntryStatus,
} from "@/components/dashboard/StatusBadge";
import {
  BadgeCheckIcon,
  CalendarCheckIcon,
  HourglassIcon,
  StopwatchIcon,
} from "@/components/ui/icons";

const RECENT: { date: string; description: string; status: EntryStatus }[] = [
  {
    date: "12 Aug",
    description: "Configured the CI pipeline and ran the first build",
    status: "approved",
  },
  {
    date: "11 Aug",
    description: "Shadowed the QA team during release testing",
    status: "submitted",
  },
  {
    date: "09 Aug",
    description: "Documented the onboarding flow for new interns",
    status: "rejected",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

const cardsParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};
const popIn = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE },
  },
};

export function DashboardPreview() {
  const reduce = useReducedMotion();

  return (
    <Section>
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#1A1A1A] sm:text-4xl">
          A dashboard students actually enjoy
        </h2>
        <p className="mt-4 text-[#666]">
          Clear stats, recent activity, and a progress tracker — the same view
          your students get on day one.
        </p>
      </Reveal>

      {/* Browser-style frame */}
      <motion.div
        className="mt-12 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
        initial={reduce ? false : { opacity: 0, y: 40, rotateX: 8 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: EASE }}
        style={{ transformPerspective: 1200 }}
      >
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#FEE2E2]" />
          <span className="h-3 w-3 rounded-full bg-[#FEF3D6]" />
          <span className="h-3 w-3 rounded-full bg-[#DCFCE7]" />
          <span className="ml-3 text-xs text-[#9CA3AF]">
            Y&apos;ello Log · Student dashboard
          </span>
        </div>

        <div className="bg-[#FAFAFA] p-4 sm:p-6">
          {/* Stat cards — the real component */}
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={reduce ? undefined : cardsParent}
            initial={reduce ? false : "hidden"}
            whileInView={reduce ? undefined : "visible"}
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={popIn}>
              <StatCard
                icon={<BadgeCheckIcon />}
                label="Total Submissions"
                value="24"
              />
            </motion.div>
            <motion.div variants={popIn}>
              <StatCard
                icon={<StopwatchIcon />}
                label="Internship Duration"
                value="24 weeks"
                rightSlot={
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium text-[#16A34A]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[#16A34A]" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                    </span>
                    Active
                  </span>
                }
              />
            </motion.div>
            <motion.div variants={popIn}>
              <StatCard
                icon={<HourglassIcon />}
                label="Completion Progress"
                value="68%"
              />
            </motion.div>
            <motion.div variants={popIn}>
              <StatCard
                icon={<CalendarCheckIcon />}
                label="Days Completed"
                value="82 days"
              />
            </motion.div>
          </motion.div>

          {/* Recent activity — real StatusBadge */}
          <div className="mt-4 rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <h3 className="text-sm font-bold text-[#1A1A1A]">
              Recent Activity
            </h3>
            <motion.div
              className="mt-4 divide-y divide-[#F3F4F6]"
              variants={reduce ? undefined : cardsParent}
              initial={reduce ? false : "hidden"}
              whileInView={reduce ? undefined : "visible"}
              viewport={{ once: true, margin: "-60px" }}
            >
              {RECENT.map((row) => (
                <motion.div
                  key={row.description}
                  variants={popIn}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#1A1A1A]">
                      {row.description}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{row.date}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
