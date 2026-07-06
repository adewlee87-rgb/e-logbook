"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  function validate() {
    let valid = true;
    setPasswordError(null);
    setConfirmError(null);

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }
    if (confirmPassword !== password) {
      setConfirmError("Passwords do not match.");
      valid = false;
    }
    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    if (!validate()) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setBanner({ type: "error", message: "Password reset failed." });
      return;
    }

    setBanner({
      type: "success",
      message: "Password reset successful, proceed to Login.",
    });
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <AuthLayout>
      <Link href="/login" className="text-sm text-[#333] hover:underline">
        ← Back
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-[#1A1A1A]">Create New Password</h1>
      <p className="mt-1 text-sm text-[#666]">Enter a new secure password</p>

      {banner && (
        <div className="mt-6">
          <Banner type={banner.type} message={banner.message} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <PasswordInput
          label="Enter Password"
          placeholder="please enter password here"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError ?? undefined}
          required
        />
        <PasswordInput
          label="Confirm Password"
          placeholder="please enter password here"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError ?? undefined}
          required
        />
        <Button type="submit" loading={loading} className="mt-2">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
