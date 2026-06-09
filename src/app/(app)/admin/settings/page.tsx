import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/env";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Settings" };

export default async function AdminSettingsPage() {
  await requireAdmin();

  const rows = [
    ["AI Provider", env.AI_PROVIDER],
    ["Render Processing", env.RENDER_PROCESSING_MODE],
    ["Storage Provider", env.STORAGE_PROVIDER],
    ["Payment Provider", env.PAYMENT_PROVIDER],
    ["Email Provider", env.EMAIL_PROVIDER],
    ["Rate Limit", env.RATE_LIMIT_ENABLED ? "Enabled" : "Disabled"],
    ["R2 Configured", env.R2_BUCKET_NAME ? "Yes" : "No"],
    ["Midtrans Configured", env.MIDTRANS_SERVER_KEY ? "Yes" : "No"],
    ["MyArchitectAI Configured", env.MYARCHITECTAI_API_KEY ? "Yes" : "No"],
    [
      "fal.ai Configured",
      env.FAL_KEY || (env.FAL_KEY_ID && env.FAL_KEY_SECRET) ? "Yes" : "No",
    ],
    ["fal Render Model", env.FAL_RENDER_MODEL],
    ["fal Style Model", env.FAL_STYLE_TRANSFER_MODEL],
    ["fal Upscale Model", env.FAL_UPSCALE_MODEL],
    ["Self-host SD Configured", env.SELFHOST_SD_API_URL ? "Yes" : "No"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border rounded-lg border border-border">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono font-medium text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
