import { AppShell } from "@/components/app/app-shell";
import { getBalance } from "@/lib/credits";
import {
  getUnreadCount,
  listNotifications,
} from "@/lib/notifications/service";
import { requireVerifiedUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireVerifiedUser();
  const [balance, unreadCount, recent] = await Promise.all([
    getBalance(session.user.id),
    getUnreadCount(session.user.id),
    listNotifications(session.user.id, 8),
  ]);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      balance={balance}
      unreadCount={unreadCount}
      isAdmin={session.user.role === "admin"}
      notifications={recent.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }))}
    >
      {children}
    </AppShell>
  );
}
