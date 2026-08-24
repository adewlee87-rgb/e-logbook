"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogoutIcon, CloseIcon } from "@/components/ui/icons";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Logout",
  description = "Are you sure you want to log out of your Y'ello Log account? You will need to log back in to access your dashboard.",
}: LogoutConfirmModalProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setLoggingOut(false);
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loggingOut) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, loggingOut]);

  if (!isOpen || !mounted) return null;

  async function handleConfirm() {
    try {
      setLoggingOut(true);
      await onConfirm();
    } catch (err) {
      console.error("Error during logout:", err);
      setLoggingOut(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-all animate-in fade-in duration-200"
      onClick={() => {
        if (!loggingOut) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loggingOut}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 transition-colors"
          aria-label="Close confirmation popup"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Header Icon Badge */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 mb-4 shadow-xs">
            <LogoutIcon className="h-7 w-7 stroke-[2]" />
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-[#111827]">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="mt-7 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loggingOut}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#374151] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loggingOut}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-75 transition-colors shadow-xs"
            >
              {loggingOut ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Logging out...</span>
                </>
              ) : (
                <span>Yes, Log Out</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
