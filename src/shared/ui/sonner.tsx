"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function Toaster({ ...props }: ToasterProps) {
  const resolvedTheme = usePreferencesStore(
    (state) => state.resolvedThemeMode || (state.values?.theme_mode === "dark" ? "dark" : "light")
  );

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-600" />,
        info: <InfoIcon className="size-4 text-blue-600" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-600" />,
        error: <OctagonXIcon className="size-4 text-rose-600" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--description-color": "var(--muted-foreground)",
          "--normal-desc": "var(--muted-foreground)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast font-sans bg-popover text-popover-foreground border border-border shadow-lg rounded-xl",
          title: "text-sm font-semibold !text-foreground",
          description: "!text-muted-foreground text-xs font-normal leading-relaxed mt-0.5",
          actionButton:
            "!bg-primary !text-primary-foreground font-medium text-xs rounded-lg px-3 py-1.5 hover:!bg-primary/90",
          cancelButton:
            "!bg-muted !text-muted-foreground font-medium text-xs rounded-lg px-3 py-1.5",
          closeButton:
            "!text-muted-foreground hover:!text-foreground",
        },
      }}
      {...props}
    />
  );
}
