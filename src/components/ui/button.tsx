import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgb(15_23_42/0.07)] hover:bg-primary/90 hover:shadow-[0_6px_14px_rgb(23_59_103/0.12)]",
        inverse: "bg-foreground text-background hover:bg-foreground/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/75",
        outline:
          "border border-input bg-card text-foreground shadow-[0_1px_1px_rgb(15_23_42/0.025)] hover:border-primary/30 hover:bg-accent/55 hover:text-primary",
        ghost: "text-foreground hover:bg-muted/80 hover:text-primary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_1px_2px_rgb(15_23_42/0.07)] hover:bg-destructive/90",
        link: "rounded-none px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-10 px-5 text-sm",
        icon: "size-9 p-0",
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
