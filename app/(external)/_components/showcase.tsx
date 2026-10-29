"use client";

import * as React from "react";
import { Activity, Calendar, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Showcase() {
  return (
    <section aria-label="MedServe Oncology Network preview" className="w-full">
      <Card className="rounded-2xl border border-border/80 shadow-md p-6 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <Activity className="size-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">
                  MedServe Oncology Network
                </span>
                <span className="text-[11px] text-muted-foreground">
                  MLCC Lagos · MKDC Kano · MUDC Umuahia
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
              NETWORK ACTIVE
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Stethoscope className="size-3.5 text-primary" />
                Oncology & Diagnostics
              </span>
              <div className="text-base font-bold text-foreground">Treatment & Imaging</div>
              <p className="text-[11px] text-muted-foreground">Precision clinical delivery across Lagos, Kano, and Umuahia</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                Patient Home
              </span>
              <div className="text-base font-bold text-foreground">Live Care Series</div>
              <p className="text-[11px] text-muted-foreground">Session itineraries, verified encounter history, and real-time alerts</p>
            </div>

            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                Clinician Hub
              </span>
              <div className="text-base font-bold text-foreground">Central Coordination</div>
              <p className="text-[11px] text-muted-foreground">Multi-centre booking, queue triage, and oncology scheduling</p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
