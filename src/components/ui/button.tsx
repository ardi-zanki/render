import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary navy CTA — the "Gass Render!" / "Daftar Sekarang" style.
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-105 hover:shadow-md",
        // Inverted ink button — auto-adapts to light/dark (the dark "Masuk"/"Download" style).
        inverse: "bg-foreground text-background hover:bg-foreground/90 shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        outline:
          "border border-input bg-card text-foreground hover:bg-muted hover:border-foreground/20",
        ghost: "text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-105 shadow-sm",
        link: "text-foreground underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        default: "h-10 px-5",
        lg: "h-12 px-7 text-base",
        icon: "size-10 p-0",
        "icon-sm": "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render as the single child element instead of a <button>. */
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
