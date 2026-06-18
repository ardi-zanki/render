/**
 * Centralized stacking order for every app overlay.
 *
 * Values stay in a normal app range so third-party full-screen embeds (for
 * example Midtrans Snap) can still cover the whole viewport when they open.
 * Each tier is exposed as a ready-to-use Tailwind class so overlays never
 * hard-code magic z-index numbers.
 *
 * Painting order (bottom -> top):
 *   sidebar  <  popover  <  modal
 */
export const zLayer = {
  /** Persistent app chrome (desktop sidebar). */
  sidebar: "z-40",
  /** Invisible click-catcher behind anchored menus / popovers. */
  popoverBackdrop: "z-[60]",
  /** Dropdown, context-menu, and popover panels. */
  popover: "z-[61]",
  /** Full-screen dimmed backdrop behind modal dialogs. */
  modalBackdrop: "z-[70]",
  /** Modal dialog panels — the topmost in-app layer. */
  modal: "z-[71]",
} as const;
