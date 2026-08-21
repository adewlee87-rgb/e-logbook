"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { OtpInput } from "@/components/ui/OtpInput";
import { createClient } from "@/lib/supabase/client";

const OTP_LENGTH = 8;

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const tokenFromUrl = searchParams.get("token") ?? searchParams.get("code");

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH;

  // Automatically verify if code/token is present in URL (e.g. user clicked email link)
  useEffect(() => {
    if (tokenFromUrl && email) {
      setLoading(true);
      const supabase = createClient();

      const verifyFromUrl = async () => {
        let { error: err } = await supabase.auth.verifyOtp({
          email,
          token: tokenFromUrl,
          type: "signup",
        });

        if (err) {
          const { error: err2 } = await supabase.auth.verifyOtp({
            email,
            token: tokenFromUrl,
            type: "email",
          });
          err = err2;
        }

        if (err) {
          setError(err.message);
          setLoading(false);
        } else {
          window.location.href = "/login?verified=1";
        }
      };

      verifyFromUrl();
    }
  }, [email, tokenFromUrl]);

  const executeVerification = useCallback(
    async (targetCode: string) => {
      if (targetCode.length !== OTP_LENGTH || !email || loading) return;
      setError(null);
      setNotice(null);
      setLoading(true);

      try {
        const supabase = createClient();
        let { error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: targetCode,
          type: "signup",
        });

        if (verifyError) {
          const { error: err2 } = await supabase.auth.verifyOtp({
            email,
            token: targetCode,
            type: "email",
          });
          verifyError = err2;
        }

        if (verifyError) {
          setError(verifyError.message || "Invalid or expired verification code.");
          setLoading(false);
          return;
        }

        window.location.href = "/login?verified=1";
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Verification error";
        setError(msg);
        setLoading(false);
      }
    },
    [email, loading]
  );

  // Automatically trigger validation as soon as all 8 digits are entered
  useEffect(() => {
    if (code.length === OTP_LENGTH && email && !loading) {
      executeVerification(code);
    }
  }, [code, email, loading, executeVerification]);

  async function handleResend() {
    if (!email) {
      setError("Please provide an email address to resend the code.");
      return;
    }
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
    setNotice("A new 8-digit verification code has been sent to your email.");
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-[#1A1A1A]">Verify Your Email</h1>
      <p className="mt-1 text-sm text-[#666]">
        We sent an 8-digit verification code to{" "}
        <span className="font-bold text-[#1A1A1A]">{email || "your email"}</span>
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
        disabled={!isComplete || loading}
        loading={loading}
        onClick={() => executeVerification(code)}
      >
        {loading ? "Verifying..." : "Continue"}
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
