import { eq } from "drizzle-orm";
import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import {
  PasswordForm,
  PreferencesForm,
  ProfileForm,
} from "@/components/app/settings-forms";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pengaturan Akun" };

export default async function SettingsPage() {
  const { user } = await requireVerifiedUser();
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, user.id),
  });

  return (
    <>
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola profil, preferensi, dan keamanan akun Anda."
      />

      <div className="flex max-w-2xl flex-col gap-6">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <Avatar name={user.name} src={user.image} size={56} />
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-foreground">
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {user.emailVerified && (
              <Badge variant="success" className="ml-auto">
                <BadgeCheck /> Terverifikasi
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              name={user.name}
              displayName={profile?.displayName ?? ""}
              email={user.email}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferensi</CardTitle>
          </CardHeader>
          <CardContent>
            <PreferencesForm
              emailNotificationsEnabled={
                profile?.emailNotificationsEnabled ?? true
              }
              defaultRenderMode={profile?.defaultRenderMode ?? "interior"}
              defaultOutputFormat={profile?.defaultOutputFormat ?? "png"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Keamanan</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
