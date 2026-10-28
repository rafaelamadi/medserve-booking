"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronDown,
  LogOut,
  Phone,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";
import type { RegisteredPatient } from "@/entities/patient";
import { getInitials } from "@/shared/lib/utils";

export interface PortalNavbarProps {
  currentPatient: RegisteredPatient;
  allPatients: RegisteredPatient[];
  onSelectPatient: (patient: RegisteredPatient) => void;
}

export function PortalNavbar({
  currentPatient,
  allPatients,
  onSelectPatient,
}: PortalNavbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Activity className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-foreground">
                MedServe
              </span>
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
              >
                Patient Portal
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              {currentPatient.centreName}
            </p>
          </div>
        </div>

        {/* Right side: Helpline + Patient Account / Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Helpline */}
          <a
            href="tel:+23418880300"
            className="hidden md:flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg border border-border/60 transition-colors"
          >
            <Phone className="size-3.5 text-primary" />
            <span>Centre Helpline:</span>
            <strong className="text-foreground font-mono">+234 1 888 0300</strong>
          </a>

          {/* Patient Account Dropdown & Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2.5 px-2.5 rounded-xl border-border/80 hover:bg-muted/60"
              >
                <Avatar className="size-6 rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(currentPatient.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <span className="block text-xs font-semibold leading-tight text-foreground">
                    {currentPatient.fullName}
                  </span>
                  <span className="block text-[10px] font-mono text-muted-foreground">
                    {currentPatient.mrn}
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-1.5">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Signed in as
                <strong className="block text-sm font-semibold text-foreground mt-0.5">
                  {currentPatient.fullName}
                </strong>
                <span className="text-[11px] font-mono text-primary">
                  {currentPatient.mrn} · {currentPatient.phone}
                </span>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Switch Patient Profile (Demo)
              </DropdownMenuLabel>

              {allPatients.slice(0, 4).map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onClick={() => onSelectPatient(p)}
                  className={`flex items-center justify-between text-xs py-2 cursor-pointer ${
                    p.id === currentPatient.id
                      ? "bg-primary/10 text-primary font-medium"
                      : ""
                  }`}
                >
                  <div className="truncate">
                    <span className="font-medium text-foreground block truncate">
                      {p.fullName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {p.mrn} · {p.centreCode}
                    </span>
                  </div>
                  {p.id === currentPatient.id && (
                    <span className="size-1.5 rounded-full bg-primary shrink-0 ml-2" />
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => router.push("/hub/login")}
                className="text-xs text-destructive focus:text-destructive cursor-pointer py-2 gap-2"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out of Portal</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
