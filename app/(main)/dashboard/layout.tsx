import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { cn } from "cn";

import { AppSidebar } from "./_components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getPreference } from "@/server/server-actions";
import { getScopeCentres } from "@/server/centre-scope";
import { CentreScopeProvider } from "@/shared/context/centre-scope-context";

import { CentreSwitcher } from "./_components/header/centre-switcher";
import { DynamicGreeting } from "./_components/header/dynamic-greeting";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const [variant, collapsible, { centres, selected: selectedCentre }] = await Promise.all([
    getPreference("sidebar_variant"),
    getPreference("sidebar_collapsible"),
    getScopeCentres(),
  ]);

  return (
    <CentreScopeProvider initialCentres={centres} initialSelected={selectedCentre}>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 68)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant={variant} collapsible={collapsible} />
        <SidebarInset
          className={cn(
            "[html[data-content-layout=centered]_&>*]:mx-auto",
            "[html[data-content-layout=centered]_&>*]:w-full",
            "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
            "peer-data-[variant=inset]:border",
            "[--dashboard-header-height:--spacing(12)]",
            "min-w-0 overflow-x-clip",
          )}
        >
          <header
            className={cn(
              "flex h-12 shrink-0 items-center border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
              "[html[data-navbar-style=sticky]_&]:bg-background/50 [html[data-navbar-style=sticky]_&]:sticky [html[data-navbar-style=sticky]_&]:top-0 [html[data-navbar-style=sticky]_&]:z-50 [html[data-navbar-style=sticky]_&]:overflow-hidden [html[data-navbar-style=sticky]_&]:rounded-t-[inherit] [html[data-navbar-style=sticky]_&]:backdrop-blur-md",
            )}
          >
            <div className="flex w-full items-center justify-between px-4 lg:px-6">
              {/* Left side: Dynamic Greeting */}
              <div className="flex items-center">
                <DynamicGreeting />
              </div>

              {/* Right side: Centre Switcher (defaults to All Centres) */}
              <div className="flex items-center">
                <CentreSwitcher centres={centres} selectedCentre={selectedCentre} />
              </div>
            </div>
          </header>
          {/* Pages can set data-content-padding="false" to render full-bleed app layouts. */}
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden p-4 has-data-[content-padding=false]:p-0 md:p-6 md:has-data-[content-padding=false]:p-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CentreScopeProvider>
  );
}
