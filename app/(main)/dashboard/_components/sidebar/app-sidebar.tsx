"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, HeartPulse } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_CONFIG } from "@/config/app-config";
import { rootUser } from "@/data/users";
import { patientSidebarItems, sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { NavPatientUser } from "./nav-patient-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const isPatientPortal = Boolean(pathname?.startsWith("/dashboard/portal") || pathname?.startsWith("/portal"));

  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-12 px-3">
              <Link
                prefetch={false}
                href={isPatientPortal ? "/dashboard/portal" : "/dashboard/default"}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                    isPatientPortal
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {isPatientPortal ? (
                    <HeartPulse className="size-5" />
                  ) : (
                    <Activity className="size-5" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {isPatientPortal ? "MedServe Care" : APP_CONFIG.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isPatientPortal ? "Patient Home" : APP_CONFIG.subtitle}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={null}>
          <NavMain items={isPatientPortal ? patientSidebarItems : sidebarItems} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        {isPatientPortal ? <NavPatientUser /> : <NavUser user={rootUser} />}
      </SidebarFooter>
    </Sidebar>
  );
}

