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
    if (!userId) return;

    const supabase = createClient();

    // Fetch initial notifications
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("id, message, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);

      setNotifications(data ?? []);
      setLoading(false);
    }

    load();

    // Setup Realtime Subscription for new notifications
    const channel = supabase
      .channel(`notifications_realtime_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotif = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Click outside to close dropdown
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
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
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
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#111827] shadow-xs transition-colors hover:bg-gray-50"
      >
        <BellIcon className="h-5 w-5 text-[#4B5563]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-88 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#111827]">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#D97706] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto pt-1 divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center px-3 py-8 text-xs text-gray-400">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-2" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-gray-500">
                <p className="font-semibold text-gray-700">All caught up!</p>
                <p className="mt-0.5 text-[11px] text-gray-400">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-3 text-left text-xs transition-colors hover:bg-gray-50 ${
                    n.is_read ? "text-gray-500 bg-white" : "text-[#111827] font-medium bg-[#FFFBEB]/60"
                  }`}
                >
                  {!n.is_read ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  ) : (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                  )}
                  <div className="flex-1">
                    <span className="block leading-relaxed">{n.message}</span>
                    <span className="mt-1 block text-[10px] text-gray-400">
                      {relativeTime(n.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
