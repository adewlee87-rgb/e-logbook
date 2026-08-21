"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon, ChevronDownIcon } from "@/components/ui/icons";

export function QuickSearchCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from && to && new Date(to) < new Date(from)) {
      alert("End date cannot be earlier than start date.");
      return;
    }
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    if (type !== "all") params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    router.push(qs ? `/supervisor/students?${qs}` : "/supervisor/students");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        <SearchIcon className="h-4 w-4 text-primary" />
        Quick Search
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#666]">Student Name or ID</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#666]">Entry Type</label>
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 pr-9 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="daily">Daily Log</option>
              <option value="weekly">Weekly Log</option>
              <option value="monthly">Monthly Log</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              <ChevronDownIcon className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#666]">Submission Date Range</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-2 focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-[#C7D2FE] py-2.5 text-sm font-semibold text-[#3730A3] transition-colors hover:bg-[#b9c4fb]"
        >
          Apply Search
        </button>
      </div>
    </form>
  );
}
