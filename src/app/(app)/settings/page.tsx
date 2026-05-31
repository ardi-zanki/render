import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pengaturan Akun" };

export default async function SettingsPage() {
  const { user } = await requireVerifiedUser();

  return (
    <>
      <PageHeader
        title="Pengaturan Akun"
        description="Kelola profil dan preferensi akun Anda."
      />
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-5 py-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.image} size={56} />
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-foreground">
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.emailVerified && (
              <Badge variant="success">
                <BadgeCheck /> Email terverifikasi
              </Badge>
            )}
            <Badge variant="secondary">Paket: Free</Badge>
          </div>
          <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            Edit profil, ganti password, dan preferensi notifikasi akan tersedia
            di fase berikutnya.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
