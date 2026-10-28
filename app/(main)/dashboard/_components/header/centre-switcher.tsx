"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { setSelectedCentre } from "@/server/centre-scope";
import type { ScopeCentre } from "@/types/centre-scope";

interface CentreSwitcherProps {
  centres: ScopeCentre[];
  selectedCentre: ScopeCentre;
}

export function CentreSwitcher({ centres, selectedCentre }: CentreSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPatientPortal = Boolean(pathname?.startsWith("/dashboard/portal") || pathname?.startsWith("/portal"));
  const [isPending, startTransition] = useTransition();

  const handleSelect = (centre: ScopeCentre) => {
    if (centre.id === selectedCentre.id) return;
    startTransition(async () => {
      await setSelectedCentre(centre.id);
      toast.success(`Active centre switched to ${centre.code}`, {
        description: `${centre.name} (${centre.city})`,
      });
      router.refresh();
    });
  };

  if (isPatientPortal) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 border-border/80 bg-background/80 px-2.5 text-xs font-medium hover:bg-muted/80 focus-visible:ring-1"
          disabled={isPending}
        >
          <div className="flex size-4 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
            <Building2 className="size-3" />
          </div>
          <span className="font-semibold text-foreground">{selectedCentre.code}</span>
          <span className="hidden text-muted-foreground sm:inline">({selectedCentre.city})</span>
          <ChevronsUpDown className="ml-1 size-3 text-muted-foreground opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-lg">
        <DropdownMenuLabel className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          <MapPin className="size-3.5" />
          MedServe Cancer Centres
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {centres.map((c) => {
          const isSelected = c.id === selectedCentre.id;
          return (
            <DropdownMenuItem
              key={c.id}
              onClick={() => handleSelect(c)}
              className="flex items-start justify-between gap-2 rounded-md p-2 cursor-pointer"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-foreground">{c.code}</span>
                  <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground font-medium">
                    {c.city}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-1">{c.name}</span>
              </div>
              {isSelected && <Check className="mt-1 size-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
    <Separator
      orientation="vertical"
      className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
    />
  </>
  );
}
