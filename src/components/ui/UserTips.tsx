"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, HelpCircleIcon } from "@/components/ui/icons";

export interface TipItem {
  id: string;
  title: string;
  content: string;
}

const DEFAULT_STUDENT_TIPS: TipItem[] = [
  {
    id: "tip-1",
    title: "Daily Logging Habit",
    content: "Submit your log entry before 6 PM daily so your industrial supervisor has time to review and stamp it on the same day.",
  },
  {
    id: "tip-2",
    title: "Attach Clear Evidence",
    content: "Adding high-quality photo evidence or documents to your entries leads to faster approval without rejection.",
  },
  {
    id: "tip-3",
    title: "Handling Rejected Logs",
    content: "If your supervisor returns an entry, check their feedback comment, click 'Edit & Resubmit', correct the observations, and send it back immediately.",
  },
  {
    id: "tip-4",
    title: "Weekly Activity Summary",
    content: "Use the 'View Reports' tab to export and generate a printable activity summary for your university defense.",
  },
];

interface UserTipsProps {
  tips?: TipItem[];
  className?: string;
}

export function UserTips({ tips = DEFAULT_STUDENT_TIPS, className = "" }: UserTipsProps) {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !tips || tips.length === 0) return null;

  const currentTip = tips[index];

  function handleNext() {
    setIndex((prev) => (prev + 1) % tips.length);
  }

  function handlePrev() {
    setIndex((prev) => (prev - 1 + tips.length) % tips.length);
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#FCD34D]/60 bg-gradient-to-r from-[#FFFBEB] via-[#FEF3D6] to-[#FEF9C3] p-4 sm:p-5 shadow-sm transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[#1A1A1A] shadow-sm">
            <HelpCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B45309]">
                User Tip #{index + 1} of {tips.length}
              </span>
            </div>
            <h4 className="mt-0.5 text-sm font-bold text-[#1A1A1A]">
              {currentTip.title}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-[#4B5563] sm:text-sm">
              {currentTip.content}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1 text-[#9CA3AF] transition-colors hover:bg-black/5 hover:text-[#1A1A1A]"
          aria-label="Dismiss tips"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#FCD34D]/40 pt-2.5">
        <div className="flex gap-1">
          {tips.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-[#B45309]" : "w-1.5 bg-[#FDE68A]"
              }`}
              aria-label={`Go to tip ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#FCD34D]/50 bg-white/80 text-[#1A1A1A] hover:bg-white"
            aria-label="Previous tip"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#FCD34D]/50 bg-white/80 text-[#1A1A1A] hover:bg-white"
            aria-label="Next tip"
          >
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
