"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BellIcon } from "@/components/ui/icons";
import { relativeTime } from "@/lib/supervisor";

interface Notification {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationsBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("notifications")
        .select("id, message, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data ?? []);
      setLoading(false);
    }
    load();
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#1A1A1A] hover:bg-gray-50"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-semibold text-[#1A1A1A]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-[#666]">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#666]">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex w-full items-start gap-2 rounded-lg px-3 py-3 text-left text-sm hover:bg-gray-50 ${
                    n.is_read ? "text-[#666]" : "text-[#1A1A1A]"
                  }`}
                >
                  {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className={n.is_read ? "pl-3.5" : ""}>
                    <span className="block">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-[#9CA3AF]">
                      {relativeTime(n.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
