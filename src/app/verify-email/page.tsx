"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { createClient } from "@/lib/supabase/client";

// Supabase's default "Confirm signup" email template sends a 6-digit OTP.
const OTP_LENGTH = 6;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  async function handleContinue() {
    if (!isComplete || !email) return;
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/login?verified=1");
  }

  async function handleResend() {
    if (!email) return;
    setError(null);
    setNotice(null);
    setResending(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }
    setNotice("A new code has been sent.");
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-[#1A1A1A]">Verify Your Email</h1>
      <p className="mt-1 text-sm text-[#666]">
        We sent a code to <span className="font-bold text-[#1A1A1A]">{email}</span>
      </p>

      {notice && (
        <div className="mt-6 text-left">
          <Banner type="success" message={notice} />
        </div>
      )}
      {error && (
        <div className="mt-6 text-left">
          <Banner type="error" message={error} />
        </div>
      )}

      <div className="mt-8">
        <OtpInput length={OTP_LENGTH} value={digits} onChange={setDigits} />
      </div>

      <Button
        className="mt-8"
        disabled={!isComplete}
        loading={loading}
        onClick={handleContinue}
      >
        Continue
      </Button>

      <p className="mt-4 text-sm text-[#666]">
        Didn&apos;t receive code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-semibold text-[#FFC107] disabled:opacity-50"
        >
          {resending ? "Resending..." : "Resend"}
        </button>
      </p>

      <p className="mt-6 text-sm">
        <Link href="/login" className="text-[#666] hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
