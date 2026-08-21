"use client";

import { useState } from "react";
import { initials } from "@/lib/supervisor";

interface StudentAvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  className?: string;
}

export function StudentAvatar({ name, url, size = 40, className = "" }: StudentAvatarProps) {
  const [imgError, setImgError] = useState(false);

  if (url && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name || "Avatar"}
        onError={() => setImgError(true)}
        style={{ width: size, height: size }}
        className={`shrink-0 rounded-full object-cover shadow-sm ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#FEF3D6] font-semibold text-[#1A1A1A] border border-[#FCD34D]/40 ${className}`}
    >
      {initials(name || "User")}
    </div>
  );
}
