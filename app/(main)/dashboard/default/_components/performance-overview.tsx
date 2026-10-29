"use client";

import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCentreScope } from "@/shared/context/centre-scope-context";

// Scope configurations for each centre
interface ScopeConfig {
  description: string;
  keys: {
    primary: { key: string; label: string; color: string };
    secondary: { key: string; label: string; color: string };
    tertiary: { key: string; label: string; color: string };
  };
  options: Array<{ value: string; label: string }>;
}

const SCOPES: Record<string, ScopeConfig> = {
  MLCC: {
    description: "Daily completed oncology treatments and consultations at MedServe LUTH Cancer Centre (Lagos).",
    keys: {
      primary: { key: "radiotherapy", label: "Radiotherapy", color: "var(--chart-1)" },
      secondary: { key: "chemotherapy", label: "Chemotherapy", color: "var(--chart-2)" },
      tertiary: { key: "brachytherapy", label: "Brachytherapy", color: "var(--chart-3)" },
    },
    options: [
      { value: "all", label: "All Oncology Services" },
      { value: "primary", label: "Radiotherapy Only" },
      { value: "secondary", label: "Chemotherapy Only" },
      { value: "tertiary", label: "Brachytherapy Only" },
    ],
  },
  MKDC: {
    description: "Daily completed diagnostic scans and lab procedures at MedServe Kano Diagnostic Centre (MKDC).",
    keys: {
      primary: { key: "ctScan", label: "CT Scan", color: "var(--chart-1)" },
      secondary: { key: "mri", label: "MRI Scan", color: "var(--chart-2)" },
      tertiary: { key: "mammography", label: "Mammography", color: "var(--chart-3)" },
    },
    options: [
      { value: "all", label: "All Diagnostic Services" },
      { value: "primary", label: "CT Scan Only" },
      { value: "secondary", label: "MRI Only" },
      { value: "tertiary", label: "Mammography Only" },
    ],
  },
  MUDC: {
    description: "Daily completed diagnostic imaging and laboratory investigations at MedServe Umuahia (MUDC).",
    keys: {
      primary: { key: "ctScan", label: "CT Scan", color: "var(--chart-1)" },
      secondary: { key: "mri", label: "MRI Scan", color: "var(--chart-2)" },
      tertiary: { key: "ultrasound", label: "Ultrasound & X-Ray", color: "var(--chart-3)" },
    },
    options: [
      { value: "all", label: "All Diagnostic Services" },
      { value: "primary", label: "CT Scan Only" },
      { value: "secondary", label: "MRI Only" },
      { value: "tertiary", label: "Ultrasound & X-Ray" },
    ],
  },
  ALL: {
    description: "Network-wide completed visits across Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC).",
    keys: {
      primary: { key: "radiotherapy", label: "Radiotherapy (MLCC)", color: "var(--chart-1)" },
      secondary: { key: "chemotherapy", label: "Chemotherapy (MLCC)", color: "var(--chart-2)" },
      tertiary: { key: "diagnostics", label: "Diagnostics (MKDC/MUDC)", color: "var(--chart-3)" },
    },
    options: [
      { value: "all", label: "All Network Services" },
      { value: "primary", label: "Radiotherapy (Lagos)" },
      { value: "secondary", label: "Chemotherapy (Lagos)" },
      { value: "tertiary", label: "Diagnostics (Kano & Umuahia)" },
    ],
  },
};

// Generate realistic throughput data tailored to the active centre scope
function generateScopedThroughput(scopeCode: string) {
  const points = [];
  const baseDate = new Date(2026, 9, 29); // Oct 29, 2026

  for (let i = 29; i >= 0; i--) {
    const d = subDays(baseDate, i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let p1 = 0;
    let p2 = 0;
    let p3 = 0;

    if (scopeCode === "MLCC") {
      p1 = isWeekend ? Math.floor(4 + (i % 3)) : Math.floor(26 + ((i * 7) % 12)); // Radiotherapy
      p2 = isWeekend ? Math.floor(2 + (i % 2)) : Math.floor(14 + ((i * 5) % 8)); // Chemotherapy
      p3 = isWeekend ? 0 : Math.floor(3 + ((i * 3) % 4)); // Brachytherapy
    } else if (scopeCode === "MKDC") {
      p1 = isWeekend ? Math.floor(3 + (i % 3)) : Math.floor(18 + ((i * 4) % 10)); // CT Scan
      p2 = isWeekend ? Math.floor(2 + (i % 2)) : Math.floor(12 + ((i * 3) % 8)); // MRI
      p3 = isWeekend ? 0 : Math.floor(8 + ((i * 2) % 6)); // Mammography
    } else if (scopeCode === "MUDC") {
      p1 = isWeekend ? Math.floor(2 + (i % 3)) : Math.floor(16 + ((i * 4) % 8)); // CT Scan
      p2 = isWeekend ? Math.floor(1 + (i % 2)) : Math.floor(10 + ((i * 3) % 7)); // MRI
      p3 = isWeekend ? Math.floor(3 + (i % 2)) : Math.floor(14 + ((i * 5) % 9)); // Ultrasound & X-Ray
    } else {
      // ALL network
      p1 = isWeekend ? Math.floor(4 + (i % 3)) : Math.floor(26 + ((i * 7) % 12)); // Radiotherapy
      p2 = isWeekend ? Math.floor(2 + (i % 2)) : Math.floor(14 + ((i * 5) % 8)); // Chemotherapy
      p3 = isWeekend ? Math.floor(6 + (i % 4)) : Math.floor(38 + ((i * 8) % 18)); // Diagnostics combined
    }

    const scope = SCOPES[scopeCode] || SCOPES.ALL;
    points.push({
      date: format(d, "yyyy-MM-dd"),
      [scope.keys.primary.key]: p1,
      [scope.keys.secondary.key]: p2,
      [scope.keys.tertiary.key]: p3,
      total: p1 + p2 + p3,
    });
  }
  return points;
}

export function PerformanceOverview() {
  const { selectedCentre } = useCentreScope();
  const centreCode = selectedCentre?.code;
  const isAll = !selectedCentre || selectedCentre.id === "all" || selectedCentre.code === "ALL";
  const activeScopeKey = isAll ? "ALL" : (centreCode && SCOPES[centreCode] ? centreCode : "ALL");
  const scopeConfig = SCOPES[activeScopeKey];

  const [period, setPeriod] = useState<"14" | "30">("30");
  const [filterMode, setFilterMode] = useState<"all" | "primary" | "secondary" | "tertiary">("all");

  const rawData = useMemo(() => {
    return generateScopedThroughput(activeScopeKey);
  }, [activeScopeKey]);

  const filteredData = useMemo(() => {
    return period === "14" ? rawData.slice(16) : rawData;
  }, [period, rawData]);

  const totalDelivered = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.total, 0);
  }, [filteredData]);

  const chartConfig = useMemo(() => {
    return {
      [scopeConfig.keys.primary.key]: {
        label: scopeConfig.keys.primary.label,
        color: scopeConfig.keys.primary.color,
      },
      [scopeConfig.keys.secondary.key]: {
        label: scopeConfig.keys.secondary.label,
        color: scopeConfig.keys.secondary.color,
      },
      [scopeConfig.keys.tertiary.key]: {
        label: scopeConfig.keys.tertiary.label,
        color: scopeConfig.keys.tertiary.color,
      },
    } satisfies ChartConfig;
  }, [scopeConfig]);

  const primaryKey = scopeConfig.keys.primary.key;
  const secondaryKey = scopeConfig.keys.secondary.key;
  const tertiaryKey = scopeConfig.keys.tertiary.key;

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="leading-none text-base md:text-lg">
              Appointment Activity by Service
            </CardTitle>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs font-normal">
              {totalDelivered} Total Visits
            </Badge>
          </div>
          <CardDescription>
            {scopeConfig.description}
          </CardDescription>
        </div>

        <CardAction className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as "14" | "30")}>
            <SelectTrigger size="sm" className="w-32 cursor-pointer">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Timeline</SelectLabel>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={filterMode}
            onValueChange={(v) => setFilterMode(v as "all" | "primary" | "secondary" | "tertiary")}
          >
            <SelectTrigger size="sm" className="w-44 cursor-pointer">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Services / Modality</SelectLabel>
                {scopeConfig.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 md:h-80 w-full">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${primaryKey})`} stopOpacity={0.4} />
                <stop offset="95%" stopColor={`var(--color-${primaryKey})`} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.5} />

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  className="w-56"
                  indicator="line"
                  labelFormatter={(value) => {
                    const date = new Date(String(value));
                    return date.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-4 justify-end" />} />

            {(filterMode === "all" || filterMode === "primary") && (
              <Area
                dataKey={primaryKey}
                name={primaryKey}
                type="monotone"
                fill="url(#fillPrimary)"
                stroke={`var(--color-${primaryKey})`}
                strokeWidth={2}
                dot={false}
                fillOpacity={1}
              />
            )}

            {(filterMode === "all" || filterMode === "secondary") && (
              <Line
                dataKey={secondaryKey}
                name={secondaryKey}
                type="monotone"
                stroke={`var(--color-${secondaryKey})`}
                strokeWidth={2}
                dot={{ r: 3, fill: `var(--color-${secondaryKey})` }}
              />
            )}

            {(filterMode === "all" || filterMode === "tertiary") && (
              <Line
                dataKey={tertiaryKey}
                name={tertiaryKey}
                type="monotone"
                stroke={`var(--color-${tertiaryKey})`}
                strokeWidth={1.75}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
