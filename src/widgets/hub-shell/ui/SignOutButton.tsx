"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/shared/ui";

export function SignOutButton() {
  return (
    <Button size="sm" variant="ghost" onClick={() => signOut({ callbackUrl: "/hub/login" })}>
      Sign out
    </Button>
  );
}
