"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import { MailIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { roleHomeRoute, type UserRole } from "@/lib/roles";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notice =
    searchParams.get("verified") === "1"
      ? "Email verified, please log in."
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email,
        password,
      },
    );

    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const role = profile?.role as UserRole | undefined;
    router.push(role ? roleHomeRoute[role] : "/login");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-[#1A1A1A]">
        Welcome to <span className="font-bold">Y&apos;ello Log</span>
      </h1>
      <p className="mt-1 text-sm text-[#666]">
        Your Internship Story Starts Here
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
          placeholder="e.g. user@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <PasswordInput
            label="Password"
            placeholder="please enter password here"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="mt-1.5 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#333] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        <Button type="submit" loading={loading} className="mt-2">
          Login
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#666]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#FFC107]">
          Sign Up
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
