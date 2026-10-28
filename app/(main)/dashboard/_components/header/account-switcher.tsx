"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
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
  const [activeUser, setActiveUser] = useState(users[0]);

  if (!activeUser) {
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
          <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(activeUser.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-semibold">
          Switch Staff Account (Dev)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((user) => (
          <DropdownMenuItem
            key={user.email}
            className={cn("p-1.5 rounded-md cursor-pointer", user.id === activeUser.id && "bg-accent/50")}
            aria-current={user.id === activeUser.id ? "true" : undefined}
            onClick={() => setActiveUser(user)}
          >
            <div className="flex w-full items-center gap-2">
              <Avatar className="size-8 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-muted-foreground">{user.role}</span>
              </div>
              <span
                className={cn(
                  "text-primary mr-1 flex size-4 items-center justify-center opacity-0",
                  user.id === activeUser.id && "opacity-100",
                )}
              >
                <Check className="size-3.5" />
              </span>
            </div>
          </DropdownMenuItem>
        ))}
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
          Sign out of Hub
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
