"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, BellRing, CalendarClock, CheckCircle2, ChevronRight, PhoneCall, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ATTENTION_ALERTS, type AttentionAlert } from "@/data/clinical-queue-data";

export function TriageAlertsPanel() {
  const handleApprove = (alert: AttentionAlert) => {
    // [SMS notification commented out; using Email via Resend]
    toast.success("Reschedule Slot Approved", {
      description: `Patient ${alert.patientName} notified via Email for tomorrow 10:00 AM.`,
    });
  };

  const handleReview = (alert: AttentionAlert) => {
    toast.info("Opening Clinical Care Series", {
      description: `Navigating to ${alert.reference} series log...`,
    });
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertCircle className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold leading-tight">
                Clinical Triage & Urgent Attention
              </CardTitle>
              <CardDescription className="text-xs">
                Patient reschedules, treatment gap flags, and communication issues across centres
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium">
            {ATTENTION_ALERTS.length} Pending Actions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ATTENTION_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col justify-between rounded-lg border border-border/80 bg-card p-3.5 shadow-xs transition-all hover:border-primary/40"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                      {alert.centreCode}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground truncate">{alert.reference}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{alert.timeAgo}</span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground tracking-tight">{alert.patientName}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {alert.detail}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2">
                {alert.type === "reschedule" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleApprove(alert)}
                    >
                      <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
                      Approve Slot
                    </Button>
                    <Link
                      href="/dashboard/series"
                      className="text-xs text-primary hover:underline flex items-center font-medium"
                    >
                      Visit Schedules
                      <ChevronRight className="size-3 ml-0.5" />
                    </Link>
                  </>
                ) : alert.type === "series_flag" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => handleReview(alert)}
                    >
                      <CalendarClock className="size-3.5 mr-1 text-amber-600" />
                      Recalculate Gap
                    </Button>
                    <Link
                      href="/dashboard/series"
                      className="text-xs text-primary hover:underline flex items-center font-medium"
                    >
                      View Series
                      <ChevronRight className="size-3 ml-0.5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5"
                      onClick={() => toast.info(`Calling patient on mobile...`)}
                    >
                      <PhoneCall className="size-3.5 mr-1 text-blue-600" />
                      Retry Call
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono">Manual Dispatch</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
