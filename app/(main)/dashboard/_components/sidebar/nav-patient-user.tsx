"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { logoutPatient } from "@/shared/lib/patientCookie";
import { Check, EllipsisVertical, HeartPulse, LogOut, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { REGISTERED_PATIENTS } from "@/data/patient-registry-data";
import { getInitials } from "@/lib/utils";
import { usePatientPortalStore } from "@/stores/patient-portal-store";

export function NavPatientUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { patient, setPatient } = usePatientPortalStore();

  const handleSignOut = async () => {
    try {
      await logoutPatient();
    } catch {}
    try {
      localStorage.removeItem("medserve_active_patient_id");
    } catch {}
    await signOut({ callbackUrl: "/hub/login?tab=patient" });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold text-xs border border-emerald-500/20">
                <AvatarFallback className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                  {getInitials(patient.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-foreground">{patient.fullName}</span>
                <span className="text-muted-foreground truncate text-xs font-mono">
                  {patient.mrn} · {patient.centreCode}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-1 font-normal">
              <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 font-semibold text-xs border border-emerald-500/20">
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
                  <span className="text-muted-foreground truncate text-[11px] mt-0.5">
                    Dr: {patient.doctorInCharge}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-xs"
                onClick={() => router.push("/dashboard/default")}
              >
                <Shield className="mr-2 size-4 text-primary" />
                Switch to Clinician Hub
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 size-4" />
              Sign Out of Care Portal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
