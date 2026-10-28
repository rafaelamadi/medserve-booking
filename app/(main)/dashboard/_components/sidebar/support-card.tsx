import { Activity, ShieldCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SupportCard() {
  return (
    <Card size="sm" className="overflow-hidden border border-border/80 bg-muted/40 shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="min-w-0 px-3.5 py-3 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Oncology Network Active</span>
        </div>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          3 Connected Centres (MLCC, MKDC, MUDC) with real-time slot coordination.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
