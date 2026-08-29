"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";
import {
  SettingsIcon,
  LogoutIcon,
  SearchIcon,
  MenuIcon,
  CloseIcon,
  HelpCircleIcon,
} from "@/components/ui/icons";
import { StudentAvatar } from "@/components/supervisor/StudentAvatar";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { SearchSuggestionsPopover } from "@/components/ui/SearchSuggestionsPopover";

const NAV = [
  {
    label: "Dashboard",
    href: "/supervisor",
    match: (p: string) => p === "/supervisor",
  },
  {
    label: "My Students",
    href: "/supervisor/students",
    match: (p: string) => p.startsWith("/supervisor/students"),
  },
  {
    label: "Review History",
    href: "/supervisor/history",
    match: (p: string) => p.startsWith("/supervisor/history"),
  },
];

interface SupervisorShellProps {
  children: ReactNode;
  userId: string;
  user: { name: string; studentId: string; avatarUrl?: string | null };
}

export function SupervisorShell({
  children,
  userId,
  user,
}: SupervisorShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState<
    { id: string; name: string; email: string; department: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setHeaderMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch student suggestions dynamically
  useEffect(() => {
    if (!query.trim() || !userId) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let isMounted = true;
    const supabase = createClient();
    const q = query.trim().toLowerCase();

    // Query profiles assigned to this supervisor
    supabase
      .from("supervisors_students")
      .select("student_id, profiles!supervisors_students_student_id_fkey(id, first_name, last_name, email, department)")
      .eq("supervisor_id", userId)
      .then(({ data }) => {
        if (!isMounted || !data) return;
        const matches: { id: string; name: string; email: string; department: string }[] = [];
        data.forEach((row) => {
          const profile = row.profiles as unknown as {
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
            department: string | null;
          } | null;

          if (profile) {
            const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Student";
            const email = profile.email || "";
            const dept = profile.department || "General SIWES";
            if (
              name.toLowerCase().includes(q) ||
              email.toLowerCase().includes(q) ||
              dept.toLowerCase().includes(q)
            ) {
              matches.push({ id: profile.id, name, email, department: dept });
            }
          }
        });
        setStudentSuggestions(matches.slice(0, 5));
        setShowSuggestions(true);
      });

    return () => {
      isMounted = false;
    };
  }, [query, userId]);

  const onSettings = pathname.startsWith("/supervisor/settings");

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(
      q
        ? `/supervisor/students?q=${encodeURIComponent(q)}`
        : "/supervisor/students",
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-[#F7F7F8]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 -translate-x-full flex-col justify-between border-r border-gray-100 bg-white px-5 py-6 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : ""
        }`}
      >
        {/* thin amber accent on the right edge */}
        <span className="pointer-events-none absolute right-0 top-0 hidden h-full w-px bg-primary/60 md:block" />

        <div>
          <div className="flex items-center justify-between">
            <Link href="/supervisor" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-[#1A1A1A]">
                {/* <BookIcon className="h-5 w-5" /> */}
                Y
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-[#1A1A1A]">
                  Y&apos;ello Log
                </span>
                <span className="block text-[11px] text-[#9CA3AF]">
                  Supervisor Portal
                </span>
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
              className="text-[#666] md:hidden"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile-only primary nav (top nav collapses here on small screens) */}
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-[#FEF3D6] text-[#1A1A1A]"
                      : "text-[#666] hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
          <Link
            href="/supervisor/settings"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              onSettings
                ? "bg-[#FEF3D6] text-[#1A1A1A]"
                : "text-[#666] hover:bg-gray-50"
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
            Settings
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={loggingOut}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[#666] transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <LogoutIcon className="h-5 w-5" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 min-w-0 max-w-full flex-col md:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="text-[#1A1A1A] md:hidden"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <span className="text-lg font-extrabold tracking-tight text-primary">
              Dashboard
            </span>

            <form
              onSubmit={handleSearch}
              className="ml-auto hidden max-w-xs flex-1 sm:block"
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (query.trim() && studentSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Search students..."
                  className="w-full rounded-full border border-[#E5E7EB] bg-white py-2 pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-2 focus:border-primary focus:outline-none"
                />
                <SearchSuggestionsPopover
                  isOpen={showSuggestions}
                  onClose={() => setShowSuggestions(false)}
                  query={query}
                  categoryLabel="Assigned Students"
                  suggestions={studentSuggestions.map((st) => ({
                    id: st.id,
                    title: st.name,
                    subtitle: st.email ? `${st.email} • ${st.department}` : st.department,
                    onClick: () => {
                      setShowSuggestions(false);
                      router.push(`/supervisor/students?q=${encodeURIComponent(st.name)}`);
                    },
                  }))}
                  onSelectAll={() => {
                    setShowSuggestions(false);
                    router.push(`/supervisor/students?q=${encodeURIComponent(query.trim())}`);
                  }}
                />
              </div>
            </form>

            <div className="ml-auto flex items-center gap-3 sm:ml-0">
              <span className="hidden text-[#9CA3AF] sm:inline-flex">
                <HelpCircleIcon className="h-5 w-5" />
              </span>
              <NotificationsBell userId={userId} />
              
              {/* Header Profile Dropdown */}
              <div className="relative" ref={headerMenuRef}>
                <button
                  onClick={() => setHeaderMenuOpen((prev) => !prev)}
                  className="flex shrink-0 items-center justify-center rounded-full p-0.5 transition-all hover:ring-2 hover:ring-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Supervisor user menu"
                  aria-expanded={headerMenuOpen}
                >
                  <StudentAvatar name={user.name} url={user.avatarUrl} size={36} />
                </button>

                {headerMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white p-2 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-[#1A1A1A] truncate">{user.name}</p>
                      <p className="text-xs text-[#6B7280]">Supervisor</p>
                    </div>

                    <Link
                      href="/supervisor/settings"
                      onClick={() => setHeaderMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <SettingsIcon className="h-4 w-4 text-gray-500" />
                      <span>Settings</span>
                    </Link>

                    <div className="my-1 border-t border-gray-100" />

                    <button
                      onClick={() => {
                        setHeaderMenuOpen(false);
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
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
