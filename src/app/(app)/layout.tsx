import { AppShell } from "@/components/app/app-shell";
import { getBalance } from "@/lib/credits";
import { requireVerifiedUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireVerifiedUser();
  const balance = await getBalance(session.user.id);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      balance={balance}
    >
      {children}
    </AppShell>
  );
}
