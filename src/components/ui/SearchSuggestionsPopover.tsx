"use client";

import { useEffect, useRef } from "react";

export interface SuggestionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: "success" | "warning" | "danger" | "info" | "default";
  };
  category?: string;
  onClick: () => void;
}

interface SearchSuggestionsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: SuggestionItem[];
  query: string;
  categoryLabel?: string;
  onSelectAll?: () => void;
}

export function SearchSuggestionsPopover({
  isOpen,
  onClose,
  suggestions,
  query,
  categoryLabel = "Suggestions",
  onSelectAll,
}: SearchSuggestionsPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !query.trim()) return null;

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
          {categoryLabel} ({suggestions.length})
        </span>
        {onSelectAll && (
          <button
            type="button"
            onClick={onSelectAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Press Enter for all results
          </button>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto py-1">
        {suggestions.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-500">
            No matching suggestions found for &ldquo;<span className="font-semibold text-gray-800">{query}</span>&rdquo;
          </div>
        ) : (
          suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-sm font-semibold text-[#1A1A1A]">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="truncate text-xs text-[#6B7280]">
                    {item.subtitle}
                  </span>
                )}
              </div>

              {item.badge && (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                    item.badge.variant === "success"
                      ? "bg-green-100 text-green-700"
                      : item.badge.variant === "warning"
                      ? "bg-amber-100 text-amber-700"
                      : item.badge.variant === "danger"
                      ? "bg-red-100 text-red-700"
                      : item.badge.variant === "info"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {item.badge.text}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
