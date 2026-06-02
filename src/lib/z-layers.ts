/**
 * Centralized stacking order for every app overlay.
 *
 * All values live near the top of the 32-bit z-index range because the app
 * sidebar is intentionally kept above third-party embeds (e.g. the Midtrans
 * Snap payment iframe). Each tier is exposed as a ready-to-use Tailwind class
 * so overlays never hard-code magic z-index numbers.
 *
 * Painting order (bottom -> top):
 *   sidebar  <  popover  <  modal
 */
export const zLayer = {
  /** Persistent app chrome (desktop sidebar). */
  sidebar: "z-[2147481000]",
  /** Invisible click-catcher behind anchored menus / popovers. */
  popoverBackdrop: "z-[2147482400]",
  /** Dropdown, context-menu, and popover panels. */
  popover: "z-[2147482500]",
  /** Full-screen dimmed backdrop behind modal dialogs. */
  modalBackdrop: "z-[2147483600]",
  /** Modal dialog panels — the topmost in-app layer. */
  modal: "z-[2147483601]",
} as const;
