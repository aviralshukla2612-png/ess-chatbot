"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", "register");
      router.replace(`/login?${params.toString()}`);
    } else {
      router.replace("/login?tab=register");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#963DFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
