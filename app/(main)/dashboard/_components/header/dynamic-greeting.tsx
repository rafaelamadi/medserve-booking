"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { rootUser } from "@/entities/staff-user/model/users";

export function DynamicGreeting() {
  const { data: session } = useSession();
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

  const userName = session?.user?.name || rootUser.name;

  return (
    <div className="flex items-center gap-1.5 text-xs sm:text-sm tracking-tight select-none">
      <span className="text-muted-foreground font-medium">{greeting},</span>
      <span className="font-semibold text-foreground">{userName}</span>
    </div>
  );
}
