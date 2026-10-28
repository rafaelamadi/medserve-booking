"use client";

import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, XAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

// 30-day realistic oncology network throughput data (MLCC, MKDC, MUDC)
const generateClinicalThroughput = () => {
  const points = [];
  const baseDate = new Date(2026, 9, 26); // Oct 26, 2026

  for (let i = 29; i >= 0; i--) {
    const d = subDays(baseDate, i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Clinical radiotherapy & chemo scale down on weekends (emergency/inpatient fractions only)
    const radiotherapy = isWeekend ? Math.floor(4 + (i % 3)) : Math.floor(28 + ((i * 7) % 16));
    const chemotherapy = isWeekend ? Math.floor(2 + (i % 2)) : Math.floor(14 + ((i * 5) % 10));
    const consultations = isWeekend ? Math.floor(1 + (i % 2)) : Math.floor(18 + ((i * 3) % 12));

    points.push({
      date: format(d, "yyyy-MM-dd"),
      radiotherapy,
      chemotherapy,
      consultations,
      total: radiotherapy + chemotherapy + consultations,
    });
  }
  return points;
};

const throughputData = generateClinicalThroughput();

const chartConfig = {
  radiotherapy: {
    label: "Radiotherapy Fractions",
    color: "var(--chart-1)",
  },
  chemotherapy: {
    label: "Chemotherapy Sessions",
    color: "var(--chart-2)",
  },
  consultations: {
    label: "Oncology Consults",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function PerformanceOverview() {
  const [period, setPeriod] = useState<"14" | "30">("30");
  const [modality, setModality] = useState<"all" | "radiotherapy" | "chemotherapy">("all");

  const filteredData = useMemo(() => {
    const slice = period === "14" ? throughputData.slice(16) : throughputData;
    return slice;
  }, [period]);

  const totalDelivered = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.total, 0);
  }, [filteredData]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="leading-none text-base md:text-lg">Clinical Throughput & Modality Activity</CardTitle>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs font-normal">
              {totalDelivered} total clinical visits
            </Badge>
          </div>
          <CardDescription>
            Daily treatment delivery and patient sessions across MLCC Lagos, MKDC Kano, and MUDC Abuja
          </CardDescription>
        </div>

        <CardAction className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as "14" | "30")}>
            <SelectTrigger size="sm" className="w-32">
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

          <Select value={modality} onValueChange={(v) => setModality(v as "all" | "radiotherapy" | "chemotherapy")}>
            <SelectTrigger size="sm" className="w-36">
              <SelectValue placeholder="All Modalities" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Treatment Modality</SelectLabel>
                <SelectItem value="all">All Modalities</SelectItem>
                <SelectItem value="radiotherapy">Radiotherapy Only</SelectItem>
                <SelectItem value="chemotherapy">Chemo Only</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 md:h-80 w-full">
          <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRadiotherapy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-radiotherapy)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-radiotherapy)" stopOpacity={0.05} />
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

            {(modality === "all" || modality === "radiotherapy") && (
              <Area
                dataKey="radiotherapy"
                name="radiotherapy"
                type="monotone"
                fill="url(#fillRadiotherapy)"
                stroke="var(--color-radiotherapy)"
                strokeWidth={2}
                dot={false}
                fillOpacity={1}
              />
            )}

            {(modality === "all" || modality === "chemotherapy") && (
              <Line
                dataKey="chemotherapy"
                name="chemotherapy"
                type="monotone"
                stroke="var(--color-chemotherapy)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--color-chemotherapy)" }}
              />
            )}

            {modality === "all" && (
              <Line
                dataKey="consultations"
                name="consultations"
                type="monotone"
                stroke="var(--color-consultations)"
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
