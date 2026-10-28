"use client";

import * as React from "react";
import {
  Clock,
  Droplet,
  Info,
  Shirt,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

export interface ClinicalPrepCardProps {
  primaryService?: string;
  technique?: string;
}

export function ClinicalPrepCard({ primaryService, technique }: ClinicalPrepCardProps) {
  const isRadiotherapy = (primaryService || "").toLowerCase().includes("radio") || (technique || "").toLowerCase().includes("vmat");

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="size-4 text-primary" />
              Clinical Preparation Guidelines
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {isRadiotherapy ? "Radiotherapy Protocol" : "General Clinical Protocol"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Please review these procedural guidelines before arriving for your next session.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card 1: Hydration / Bladder Protocol */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Droplet className="size-4 text-sky-500 shrink-0" />
              <span>Hydration Protocol</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Drink 500ml (approx. 2 glasses) of water 30 minutes prior to your appointment time. Do not void your bladder right before your scan to preserve anatomical alignment.
            </p>
          </div>

          {/* Card 2: Attire & Accessories */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Shirt className="size-4 text-emerald-500 shrink-0" />
              <span>Appropriate Attire</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Wear loose, two-piece cotton clothing. Avoid wearing metallic accessories, belts, wire undergarments, or jewelry around the target scan region.
            </p>
          </div>

          {/* Card 3: Skin Care for Radiotherapy */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Sparkles className="size-4 text-amber-500 shrink-0" />
              <span>Treatment Area Skin Care</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Do not apply scented lotions, perfumed powders, or metallic-based creams to the designated mark area on the morning of your treatment.
            </p>
          </div>

          {/* Card 4: Arrival & Check-in */}
          <div className="p-3.5 rounded-xl border bg-muted/20 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Clock className="size-4 text-primary shrink-0" />
              <span>Reception Check-In</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Arrive at least 15 minutes before your time slot. Present your Medical Record Number (MRN) at the reception desk for instant check-in.
            </p>
          </div>
        </div>

        {/* Clinical Note banner */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="size-4 text-primary shrink-0 mt-0.5" />
          <span>
            If you experience high fever, severe nausea, or acute discomfort prior to your scheduled treatment, contact the oncology nursing desk immediately at <strong className="text-foreground">+234 1 888 0300</strong>.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
