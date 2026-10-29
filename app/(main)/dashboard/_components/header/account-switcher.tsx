"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "cn";
import { Check, HeartPulse, LogOut, Shield, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REGISTERED_PATIENTS } from "@/data/patient-registry-data";
import { getInitials } from "@/lib/utils";
import { usePatientPortalStore } from "@/stores/patient-portal-store";

export function AccountSwitcher({
  users,
}: {
  readonly users: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role: string;
    readonly centres?: readonly string[];
  }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isPatientPortal = Boolean(pathname?.startsWith("/dashboard/portal") || pathname?.startsWith("/portal"));
  const { patient, setPatient } = usePatientPortalStore();
  const { data: session } = useSession();
  const [activeUser, setActiveUser] = useState(users[0]);

  const currentUser = session?.user
    ? {
        id: session.user.id || "current",
        name: session.user.name || "Staff Member",
        email: session.user.email || "",
        avatar: session.user.image || "",
        role: (session.user as { role?: string }).role || "Staff",
      }
    : activeUser;

  if (!currentUser) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // offline fallback
    }
    router.push("/hub/login");
    router.refresh();
  };

  if (isPatientPortal) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-8 rounded-lg cursor-pointer bg-emerald-500/10 text-emerald-600 font-semibold text-xs border border-emerald-500/20">
            <AvatarFallback className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
              {getInitials(patient.fullName)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-64 space-y-1 rounded-lg p-1.5" side="bottom" align="end" sideOffset={4}>
          <DropdownMenuLabel className="p-1 font-normal">
            <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold text-xs border border-emerald-500/20">
                <AvatarFallback className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                  {getInitials(patient.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-bold text-foreground text-sm">{patient.fullName}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    Patient
                  </Badge>
                </div>
                <span className="text-muted-foreground truncate text-[11px] font-mono mt-0.5">
                  {patient.mrn} · {patient.centreName}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer text-xs" onClick={() => router.push("/dashboard/default")}>
              <Shield className="mr-2 size-4 text-primary" />
              Switch to Clinician Hub
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-xs text-destructive focus:text-destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 size-4" />
            Sign out of Care Portal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 rounded-lg cursor-pointer bg-primary/10 text-primary font-semibold text-xs border border-border/80">
          <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(currentUser.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel className="p-1 font-normal">
          <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-border/80">
              <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold text-foreground text-sm">{currentUser.name}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                  {currentUser.role}
                </Badge>
              </div>
              <span className="text-muted-foreground truncate text-[11px] font-mono mt-0.5">
                {currentUser.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/settings/users")}>
            <Shield className="mr-2 size-4 text-primary" />
            Staff Roles & Scope
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
