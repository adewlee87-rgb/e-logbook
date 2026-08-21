"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CameraIcon, CloseIcon } from "@/components/ui/icons";

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

  // Modal state
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const cleanName = name.trim() || "Student";
  const initials =
    cleanName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "S";

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setSelectedImageSrc(objectUrl);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }

  function handleCancelModal() {
    if (selectedImageSrc) {
      URL.revokeObjectURL(selectedImageSrc);
    }
    setSelectedImageSrc(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleConfirmSave() {
    if (!selectedImageSrc || !selectedFile) return;
    setUploading(true);

    try {
      const image = new Image();
      image.src = selectedImageSrc;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      const OUTPUT_SIZE = 400; // High quality 400x400 output avatar
      const VIEWPORT_SIZE = 256; // 256px (h-64 w-64) preview modal viewport
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        ctx.save();
        ctx.beginPath();
        ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();

        const naturalW = image.naturalWidth || image.width;
        const naturalH = image.naturalHeight || image.height;

        // Base cover scale inside 256px viewport
        const baseScale = Math.max(VIEWPORT_SIZE / naturalW, VIEWPORT_SIZE / naturalH);
        const baseWidth = naturalW * baseScale;
        const baseHeight = naturalH * baseScale;

        // Coordinates of image top-left relative to 256px viewport
        const screenX = VIEWPORT_SIZE / 2 + position.x - (baseWidth * zoom) / 2;
        const screenY = VIEWPORT_SIZE / 2 + position.y - (baseHeight * zoom) / 2;

        // Scale proportionally to 400px output canvas
        const canvasScale = OUTPUT_SIZE / VIEWPORT_SIZE;
        const drawW = baseWidth * zoom * canvasScale;
        const drawH = baseHeight * zoom * canvasScale;
        const drawX = screenX * canvasScale;
        const drawY = screenY * canvasScale;

        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Failed to generate cropped image");

      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      await supabase.from("profiles").update({ passport_photo_url: publicUrl }).eq("id", userId);
      setPreview(publicUrl);
      onUploaded?.(publicUrl);
      handleCancelModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert("Error saving profile image: " + msg);
    } finally {
      setUploading(false);
    }
  }

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.min(3, Math.max(1, prev - e.deltaY * 0.003)));
  };

  return (
    <>
      <div className="relative inline-block" style={{ width: size, height: size }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name} className="h-full w-full rounded-full object-cover shadow-sm" />
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
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Profile Image Confirmation & Adjustment Modal */}
      {selectedImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-[#1A1A1A]">Adjust Profile Picture</h3>
              <button onClick={handleCancelModal} className="text-gray-400 hover:text-black">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#666]">
              Drag image to center and use slider or scroll wheel to adjust framing.
            </p>

            {/* Circular framing viewport (256px x 256px) */}
            <div
              className="relative mx-auto mt-4 h-64 w-64 cursor-grab overflow-hidden rounded-full border-4 border-primary bg-gray-100 shadow-inner active:cursor-grabbing touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImageSrc}
                alt="Preview"
                className="absolute max-w-none select-none pointer-events-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                  top: "50%",
                  left: "50%",
                  minWidth: "100%",
                  minHeight: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Zoom Slider */}
            <div className="mt-6 space-y-1">
              <label className="flex justify-between text-xs font-medium text-[#333]">
                <span>Zoom Level</span>
                <span>{zoom.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={handleCancelModal}
                disabled={uploading}
                className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-[#333] hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={uploading}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50"
              >
                {uploading ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
