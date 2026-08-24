"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className="rounded-full bg-[#FFC107] px-5 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#e6ac00] disabled:opacity-50 transition-colors"
      >
        {loading ? "Signing out..." : "Sign out"}
      </button>

      <LogoutConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleSignOut}
      />
    </>
  );
}
