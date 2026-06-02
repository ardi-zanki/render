"use client";

import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/components/theme-provider";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-card text-card-foreground shadow-elevated",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-secondary-foreground",
          closeButton: "border-border bg-card text-muted-foreground",
        },
      }}
    />
  );
}
