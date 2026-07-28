"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { TextInput } from "@/components/ui/TextInput";
import { MailIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          school,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Something went wrong creating your account.");
      setLoading(false);
      return;
    }

    if (data.user.identities && data.user.identities.length === 0) {
      setError("An account with this email already exists. Try logging in instead.");
      setLoading(false);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-bold text-[#1A1A1A]">Create New Account</h1>
      <p className="mt-1 text-sm text-[#666]">Fill in the information below</p>

      {error && (
        <div className="mt-6">
          <Banner type="error" message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <TextInput
          label="First Name"
          placeholder="e.g Folayan"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <TextInput
          label="Last Name"
          placeholder="e.g Eniola"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <TextInput
          label="Email Address"
          type="email"
          icon={<MailIcon />}
          placeholder="e.g folayaneniola1@yahoo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label="School Name"
          placeholder="e.g Obafemi Awolowo University"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="please enter password here"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Button type="submit" loading={loading} className="mt-2">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#666]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#FFC107]">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
