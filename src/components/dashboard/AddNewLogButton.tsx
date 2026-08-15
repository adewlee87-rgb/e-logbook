"use client";

import { useState } from "react";
import { LogFormModal } from "@/components/dashboard/LogFormModal";
import { PlusIcon } from "@/components/ui/icons";

interface AddNewLogButtonProps {
  alreadyLoggedToday?: boolean;
}

export function AddNewLogButton({ alreadyLoggedToday = false }: AddNewLogButtonProps) {
  const [open, setOpen] = useState(false);

  if (alreadyLoggedToday) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled
          title="You've already logged today. Edit today's entry from your reports."
          className="flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-primary/50 px-6 py-3 text-sm font-semibold text-[#1A1A1A]/60 sm:justify-start"
        >
          <PlusIcon className="h-4 w-4" />
          Add New Log
        </button>
        <p className="text-xs text-[#9CA3AF]">You&apos;ve logged today</p>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] sm:justify-start"
      >
        <PlusIcon className="h-4 w-4" />
        Add New Log
      </button>

      <LogFormModal open={open} onClose={() => setOpen(false)} mode="create" />
    </>
  );
}
