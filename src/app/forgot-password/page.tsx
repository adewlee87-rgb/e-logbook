"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { MailIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setNotice("Reset link sent. Check your email.");
  }

  return (
    <AuthLayout>
      <Link href="/login" className="text-sm text-[#333] hover:underline">
        ← Back
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-[#1A1A1A]">Forgot Password</h1>
      <p className="mt-1 text-sm text-[#666]">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {notice && (
        <div className="mt-6">
          <Banner type="success" message={notice} />
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Banner type="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextInput
          label="Email"
          type="email"
          icon={<MailIcon />}
          placeholder="ex: adewaleOluwatobi@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="mt-2">
          Send Reset Link
        </Button>
      </form>
    </AuthLayout>
  );
}
