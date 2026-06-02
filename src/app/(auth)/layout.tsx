import { ModeToggle } from "@/components/ui/mode-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-8">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_14%,transparent),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-[min(42rem,90vw)] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative z-[1] w-full max-w-md">{children}</div>
    </div>
  );
}
