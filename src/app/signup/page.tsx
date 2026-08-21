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

import { validatePasswordStrength } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValidation = validatePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordValidation.isValid) {
      setError(passwordValidation.error ?? "Password does not meet strength requirements.");
      return;
    }

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
          placeholder="e.g. Chinedu"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <TextInput
          label="Last Name"
          placeholder="e.g. Abubakar"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <TextInput
          label="Email Address"
          type="email"
          icon={<MailIcon />}
          placeholder="e.g. chinedu.abubakar@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextInput
          label="School Name"
          placeholder="e.g. Obafemi Awolowo University"
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          required
        />
        <div>
          <PasswordInput
            label="Password"
            placeholder="enter a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password.length > 0 && (
            <div className="mt-2 text-xs space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-700">Password requirements:</p>
              <div className="grid grid-cols-2 gap-1 text-gray-600">
                <span className={passwordValidation.checks.length ? "text-green-600 font-medium" : ""}>
                  {passwordValidation.checks.length ? "✓" : "•"} At least 8 chars
                </span>
                <span className={passwordValidation.checks.uppercase ? "text-green-600 font-medium" : ""}>
                  {passwordValidation.checks.uppercase ? "✓" : "•"} Uppercase (A-Z)
                </span>
                <span className={passwordValidation.checks.lowercase ? "text-green-600 font-medium" : ""}>
                  {passwordValidation.checks.lowercase ? "✓" : "•"} Lowercase (a-z)
                </span>
                <span className={passwordValidation.checks.number ? "text-green-600 font-medium" : ""}>
                  {passwordValidation.checks.number ? "✓" : "•"} Number (0-9)
                </span>
                <span className={`col-span-2 ${passwordValidation.checks.special ? "text-green-600 font-medium" : ""}`}>
                  {passwordValidation.checks.special ? "✓" : "•"} Special character (!@#$%^&*)
                </span>
              </div>
            </div>
          )}
        </div>
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
