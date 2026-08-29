"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { SearchIcon, ProfileIcon, SettingsIcon, LogoutIcon } from "@/components/ui/icons";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import { StudentAvatar } from "@/components/supervisor/StudentAvatar";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { createClient } from "@/lib/supabase/client";
import { SearchSuggestionsPopover } from "@/components/ui/SearchSuggestionsPopover";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<
    { id: string; title: string; subtitle: string; status: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch report suggestions as user types
  useEffect(() => {
    if (!query.trim() || !userId) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let isMounted = true;
    const supabase = createClient();
    const q = query.trim().toLowerCase();

    supabase
      .from("logbook_entries")
      .select("id, title, date, status, observations, objective")
      .eq("student_id", userId)
      .or(`title.ilike.%${q}%,observations.ilike.%${q}%,objective.ilike.%${q}%`)
      .order("date", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (isMounted && data) {
          const mapped = data.map((e) => ({
            id: e.id,
            title: e.title || "Untitled Log",
            subtitle: `Logged: ${e.date}`,
            status: e.status,
          }));
          setSuggestions(mapped);
          setShowSuggestions(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query, userId]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = query.trim();
    router.push(trimmed ? `/student/report?q=${encodeURIComponent(trimmed)}` : "/student/report");
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
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
              onFocus={() => {
                if (query.trim() && suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search your reports"
              className="w-full rounded-full border border-[#E5E7EB] bg-white py-2.5 pl-11 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-black focus:outline-none"
            />
            <SearchSuggestionsPopover
              isOpen={showSuggestions}
              onClose={() => setShowSuggestions(false)}
              query={query}
              categoryLabel="Matching Reports"
              suggestions={suggestions.map((s) => ({
                id: s.id,
                title: s.title,
                subtitle: s.subtitle,
                badge: {
                  text: s.status,
                  variant:
                    s.status === "approved"
                      ? "success"
                      : s.status === "rejected"
                      ? "danger"
                      : s.status === "submitted"
                      ? "warning"
                      : "default",
                },
                onClick: () => router.push(`/student/report?entry=${s.id}`),
              }))}
              onSelectAll={() => {
                setShowSuggestions(false);
                router.push(`/student/report?q=${encodeURIComponent(query.trim())}`);
              }}
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-4">
          <NotificationsBell userId={userId} />

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex shrink-0 items-center justify-center rounded-full p-0.5 transition-all hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="User menu"
              aria-expanded={menuOpen}
            >
              <StudentAvatar name={user.name} url={user.avatarUrl} size={40} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-[#1A1A1A] truncate">{user.name}</p>
                  <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                </div>

                <Link
                  href="/student/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ProfileIcon className="h-4 w-4 text-gray-500" />
                  <span>View Profile</span>
                </Link>

                <Link
                  href="/student/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SettingsIcon className="h-4 w-4 text-gray-500" />
                  <span>Account Settings</span>
                </Link>

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowLogoutModal(true);
                  }}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <LogoutIcon className="h-4 w-4 text-red-600" />
                  <span>{loggingOut ? "Logging out..." : "Logout"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
