"use server";

import { revalidatePath } from "next/cache";

import { retryRender } from "@/lib/admin/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/session";
import { retryRenderSchema } from "@/lib/validations/api";

export async function retryRenderAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const parsed = retryRenderSchema.safeParse({
    renderId: formData.get("renderId"),
  });
  if (!parsed.success) return;
  const { renderId } = parsed.data;
  await retryRender(session.user.id, renderId);
  revalidatePath("/admin/renders");
}
