"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CameraIcon } from "@/components/ui/icons";

interface AvatarUploadProps {
  userId: string;
  name: string;
  avatarUrl: string | null;
  size?: number;
  onUploaded?: (url: string) => void;
}

export function AvatarUpload({ userId, name, avatarUrl, size = 128, onUploaded }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);

  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  async function handleFile(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      await supabase.from("profiles").update({ passport_photo_url: publicUrl }).eq("id", userId);
      setPreview(publicUrl);
      onUploaded?.(publicUrl);
    }
    setUploading(false);
  }

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FEF3D6] text-2xl font-semibold text-[#1A1A1A]">
          {initials}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Change photo"
        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50"
      >
        <CameraIcon className="h-4 w-4" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
