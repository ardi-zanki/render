"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { zLayer } from "@/lib/z-layers";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard app modal: full-screen dimmed backdrop rendered into `document.body`
 * so it always covers the header, sidebar, and every other component. Handles
 * scroll-lock, ESC-to-close, backdrop-click-to-close, focus trapping, and
 * focus restore so every dialog behaves identically.
 *
 * Pass the dialog's visible body as `children` and its sizing/skin via
 * `panelClassName`.
 */
export function Modal({
  onClose,
  children,
  panelClassName,
  containerClassName,
  closeOnBackdrop = true,
  labelledBy,
  label,
}: {
  onClose: () => void;
  children: ReactNode;
  /** Classes for the dialog panel (sizing, padding, skin). */
  panelClassName?: string;
  /** Classes for the centering container (outer padding overrides). */
  containerClassName?: string;
  /** Close when the dimmed backdrop is clicked. Defaults to true. */
  closeOnBackdrop?: boolean;
  /** id of the visible element that labels the dialog. */
  labelledBy?: string;
  /** Accessible name when there is no visible heading to reference. */
  label?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock page scroll and wire ESC-to-close.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Focus the first control on open, trap Tab within the dialog, and restore
  // focus to the previously focused element on close.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );

    (focusable()[0] ?? panel).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener("keydown", onKeyDown);
    return () => {
      panel.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center p-4",
        zLayer.modalBackdrop,
        containerClassName,
      )}
    >
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
        className={cn("relative outline-none", zLayer.modal, panelClassName)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
