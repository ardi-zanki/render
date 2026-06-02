"use server";

import { revalidatePath } from "next/cache";

import { retryRender } from "@/lib/admin/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/session";

export async function retryRenderAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const renderId = String(formData.get("renderId") ?? "");
  if (!renderId) return;
  await retryRender(session.user.id, renderId);
  revalidatePath("/admin/renders");
}
