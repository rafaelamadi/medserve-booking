import Link from "next/link";
import { ArrowUpRight, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function Intro() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl leading-snug font-semibold tracking-tight text-balance sm:text-3xl text-foreground" id="hero-title">
          MedServe Oncology Network & Clinical Booking System
        </h1>
        <p className="text-muted-foreground text-sm leading-6 sm:text-base">
          Precision oncology and diagnostic appointment scheduling, multi-fraction care series, and patient care tracking across Nigeria (MLCC Lagos, MKDC Kano, and MUDC Umuahia).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Button asChild size="lg" className="gap-2 shadow-xs">
          <Link href="/portal" prefetch={false}>
            <HeartPulse className="size-4" />
            Patient Home
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/hub/login" prefetch={false}>
            <ShieldCheck className="size-4 text-primary" />
            Clinician & Staff Hub
          </Link>
        </Button>

        <Button asChild variant="ghost" size="lg" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/default" prefetch={false}>
            Clinical Dashboard
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
