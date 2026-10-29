"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { usePatientPortalStore } from "@/entities/patient";

export function DynamicGreeting() {
  const pathname = usePathname();
  const isPatientPortal = Boolean(pathname?.startsWith("/dashboard/portal") || pathname?.startsWith("/portal"));
  const { data: session, status } = useSession();
  const { patient } = usePatientPortalStore();
  const [greeting, setGreeting] = useState("Good morning");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    };

    updateGreeting();
    // Re-check periodically
    const timer = setInterval(updateGreeting, 60000);
    return () => clearInterval(timer);
  }, []);

  if (status === "loading" || !mounted) {
    return (
      <div className="flex items-center gap-1.5 text-xs sm:text-sm tracking-tight select-none">
        <span className="text-muted-foreground font-medium">{greeting},</span>
        <span className="h-4 w-28 bg-muted animate-pulse rounded inline-block" />
      </div>
    );
  }

  const userName = isPatientPortal
    ? (patient?.fullName && patient.fullName !== "Chidinma Nwosu"
        ? patient.fullName
        : session?.user?.name || patient?.fullName || "Patient")
    : (session?.user?.name || "Staff Member");

  return (
    <div className="flex items-center gap-1.5 text-xs sm:text-sm tracking-tight select-none">
      <span className="text-muted-foreground font-medium">{greeting},</span>
      <span className="font-semibold text-foreground">{userName}</span>
    </div>
  );
}
