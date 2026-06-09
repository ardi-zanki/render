import { ModeToggle } from "@/components/ui/mode-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-6">
      <div className="absolute right-4 top-4">
        <ModeToggle />
      </div>
      <div className="relative z-[1] w-full max-w-md">{children}</div>
    </div>
  );
}
