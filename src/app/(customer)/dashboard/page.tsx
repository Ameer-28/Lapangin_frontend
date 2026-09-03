"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-gray-500 text-sm">
      <div className="w-8 h-8 border-3 border-[#16A34A] border-t-transparent rounded-full animate-spin mr-3" />
      Mengalihkan ke halaman utama...
    </div>
  );
}
