"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchIcon } from "@/components/ui/icons";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";

interface TopbarProps {
  title: string;
  userId: string;
  user: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export function Topbar({ title, userId, user }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/student/report?q=${encodeURIComponent(trimmed)}` : "/student/report");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-xl font-medium text-[#666]">{title}</h1>

      <form onSubmit={handleSearch} className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
        <div className="relative w-full sm:max-w-sm sm:ml-auto">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your reports"
            className="w-full rounded-full border border-[#E5E7EB] bg-white py-2.5 pl-11 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
          />
        </div>
      </form>

      <div className="flex shrink-0 items-center gap-4">
        <NotificationsBell userId={userId} />

        <div className="flex shrink-0 items-center gap-3">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-11 w-11 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FEF3D6] text-sm font-semibold text-[#1A1A1A]">
              {initials}
            </div>
          )}
          <div className="hidden leading-tight md:block">
            <div className="text-sm font-semibold text-[#1A1A1A]">{user.name}</div>
            <div className="text-xs text-[#9CA3AF]">{user.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
