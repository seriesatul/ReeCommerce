"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for form and UI
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Industry practice: Check for success messages in the URL (e.g., from Registration)
  useEffect(() => {
    const msg = searchParams.get("success");
    if (msg) setSuccess(msg);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // We use NextAuth's signIn function
    const result = await signIn("credentials", {
      redirect: false, // We handle redirection manually for better UX
      email: formData.email,
      password: formData.password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Success: Send them to the home page or dashboard
      router.push("/");
      router.refresh(); // Forces the Navbar to update and show "Hi, User"
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-white p-10 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Success Message Alert */}
        {success && (
          <div className="rounded-lg bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100">
            {success}
          </div>
        )}

        {/* Error Message Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input
                type="password"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider for Social Login */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Or continue with</span></div>
        </div>

        <button
          onClick={() => signIn("google")}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
          Google
        </button>

        <p className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-blue-600 hover:text-blue-500">Register</Link>
        </p>
      </div>
    </div>
  );
}