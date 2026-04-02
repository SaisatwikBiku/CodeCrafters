"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AUTH } from "@/lib/auth";
import { SERVER_URL } from "./CONSTANT";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (AUTH.isLoggedIn()) {
        try {
          const res = await fetch(`${SERVER_URL}/api/auth/me`, {
            headers: AUTH.authHeaders(),
          });
          if (res.ok) {
            router.replace("/lobby");
            return;
          } else {
            AUTH.clearAuth();
          }
        } catch {
          AUTH.clearAuth();
        }
      }
      router.replace("/login");
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
      <div className="spinner" />
    </div>
  );
}
