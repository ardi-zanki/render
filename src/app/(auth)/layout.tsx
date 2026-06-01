import { ModeToggle } from "@/components/ui/mode-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-4 py-8">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/6 to-transparent"
      />
      <div className="relative z-[1] w-full max-w-md">{children}</div>
    </div>
  );
}
