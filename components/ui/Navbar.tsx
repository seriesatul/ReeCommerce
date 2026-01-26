"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b bg-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          ReeCommerce
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-gray-700">
                Hi, {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/api/auth/signin" className="text-sm hover:underline">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}