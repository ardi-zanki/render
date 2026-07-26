import { cookies } from "next/headers";
import { Suspense } from "react";

import { AppShell } from "@/components/app/app-shell";
import { GoogleLinkToast } from "@/components/app/google-link-toast";
import {
  getUserProfile,
  hasGoogleAccount,
  hasPasswordAccount,
} from "@/lib/account/service";
import { getBalance } from "@/lib/credits";
import {
  getUnreadCount,
  listNotifications,
} from "@/lib/notifications/service";
import { requireVerifiedUser } from "@/lib/session";
import { getUserStorageUsage } from "@/lib/storage/usage";
import { browserUserImageUrl } from "@/lib/storage";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireVerifiedUser();
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("renderai_sidebar_expanded")?.value;
  const [
    balance,
    unreadCount,
    recent,
    profile,
    googleConnected,
    passwordReady,
    storageUsage,
  ] = await Promise.all([
      getBalance(session.user.id),
      getUnreadCount(session.user.id),
      listNotifications(session.user.id, 8),
      getUserProfile(session.user.id),
      hasGoogleAccount(session.user.id),
      hasPasswordAccount(session.user.id),
      getUserStorageUsage(session.user.id),
    ]);

  const userImage = await browserUserImageUrl(session.user.image);

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        image: userImage,
      }}
      preferences={{
        displayName: profile?.displayName ?? "",
        defaultRenderMode: profile?.defaultRenderMode ?? "interior",
        defaultOutputFormat: profile?.defaultOutputFormat ?? "png",
      }}
      balance={balance}
      initialSidebarExpanded={sidebarCookie === "false" ? false : true}
      unreadCount={unreadCount}
      isAdmin={session.user.role === "admin"}
      googleConnected={googleConnected}
      passwordReady={passwordReady}
      storageUsage={storageUsage}
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
      <Suspense fallback={null}>
        <GoogleLinkToast />
      </Suspense>
      {children}
    </AppShell>
  );
}
