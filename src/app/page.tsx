"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (userId) {
        router.replace("/editor");
      } else {
        router.replace("/sign-in");
      }
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    </div>
  );
}
