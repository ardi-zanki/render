"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { zLayer } from "@/lib/z-layers";

type Placement = "top" | "bottom";
type Align = "start" | "end";
type Position = { left?: number; right?: number; top?: number; bottom?: number };

const MARGIN = 12;

/**
 * Standard anchored dropdown / context menu. Renders into `document.body` so it
 * escapes header/sidebar stacking contexts and always layers above app chrome
 * (but below modals). Provides a transparent click-catcher backdrop,
 * ESC-to-close, and repositioning on scroll/resize. Position is derived from
 * the `anchorRef` element.
 *
 * Unlike {@link Modal}, a popover does not dim the page or trap focus — it is a
 * lightweight, non-modal surface.
 */
export function Popover<T extends HTMLElement>({
  anchorRef,
  open,
  onClose,
  children,
  width,
  placement = "bottom",
  align = "end",
  gap = 8,
  alignOffset = 0,
  className,
}: {
  anchorRef: RefObject<T | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Panel width in px (also used to clamp within the viewport). */
  width: number;
  /** Open below (default) or above the anchor. */
  placement?: Placement;
  /** Align the panel to the anchor's start (left) or end (right). */
  align?: Align;
  /** Gap in px between the anchor and the panel. */
  gap?: number;
  /** Extra px offset applied along the alignment axis. */
  alignOffset?: number;
  className?: string;
}) {
  const [position, setPosition] = useState<Position | null>(null);

  const reposition = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next: Position = {};

    if (placement === "bottom") next.top = rect.bottom + gap;
    else next.bottom = Math.max(window.innerHeight - rect.top + gap, MARGIN);

    if (align === "end") {
      next.right = Math.max(
        window.innerWidth - rect.right + alignOffset,
        MARGIN,
      );
    } else {
      const left = rect.left + alignOffset;
      next.left = Math.max(
        MARGIN,
        Math.min(left, window.innerWidth - width - MARGIN),
      );
    }
    setPosition(next);
  }, [anchorRef, placement, align, gap, alignOffset, width]);

  // Position the panel once it opens, and keep it anchored on scroll / resize.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(reposition, 0);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className={cn("fixed inset-0", zLayer.popoverBackdrop)}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        style={{
          width,
          left: position?.left,
          right: position?.right,
          top: position?.top,
          bottom: position?.bottom,
          visibility: position ? undefined : "hidden",
        }}
        className={cn("fixed", zLayer.popover, className)}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
