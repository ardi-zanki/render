import * as React from "react";

import { cn } from "@/lib/utils";

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

/**
 * Minimal Slot: merges its props onto a single child element so a styled
 * component can render *as* another element (e.g. a Next.js <Link>) without
 * an external dependency. Child props take precedence; className is merged.
 */
const Slot = React.forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, className, ...props },
  ref,
) {
  if (!React.isValidElement(children)) {
    return null;
  }

  const child = children as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props;

  return React.cloneElement(child, {
    ...props,
    ...childProps,
    ref,
    className: cn(className, childProps.className as string | undefined),
  });
});

export { Slot };
