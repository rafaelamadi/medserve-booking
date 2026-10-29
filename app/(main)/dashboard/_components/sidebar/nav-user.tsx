"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { CircleUser, EllipsisVertical, LogOut, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { getInitials } from "@/lib/utils";

export function NavUser({
  user,
}: {
  readonly user?: {
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
    readonly role?: string;
  };
}) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="h-8 w-8 rounded-lg bg-sidebar-accent/70 animate-pulse shrink-0" />
            <div className="grid flex-1 gap-1.5">
              <div className="h-3 w-24 bg-sidebar-accent/70 animate-pulse rounded" />
              <div className="h-2.5 w-32 bg-sidebar-accent/40 animate-pulse rounded" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const activeUser = session?.user
    ? {
        name: session.user.name || "Staff Member",
        email: session.user.email || "",
        avatar: session.user.image || "",
        role: (session.user as { role?: string }).role || "STAFF",
      }
    : user || {
        name: "Staff Member",
        email: "",
        avatar: "",
        role: "STAFF",
      };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch {
      // offline fallback
    }
    router.push("/hub/login");
    router.refresh();
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
              <Avatar className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">{getInitials(activeUser.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeUser.name}</span>
                <span className="text-muted-foreground truncate text-xs">{activeUser.email}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-primary/10 text-primary">
                  <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-xs">{getInitials(activeUser.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeUser.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{activeUser.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/settings/users")}>
                <ShieldCheck className="mr-2 size-4 text-primary" />
                Staff Role: {activeUser.role || "Staff"}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/settings")}>
                <CircleUser className="mr-2 size-4" />
                Hub Preferences
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign out of Hub
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
