"use server";

import { revalidatePath } from "next/cache";

import {
  manualCreditAdjustment,
  setUserDisabled,
  setUserRole,
} from "@/lib/admin/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/session";

export async function toggleDisableAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const targetId = String(formData.get("userId") ?? "");
  const disabled = formData.get("disabled") === "true";
  if (!targetId || targetId === session.user.id) return; // never disable self
  await setUserDisabled(session.user.id, targetId, disabled);
  revalidatePath("/admin/users");
}

export async function setRoleAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const targetId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "user";
  if (!targetId || targetId === session.user.id) return; // never demote self
  await setUserRole(session.user.id, targetId, role);
  revalidatePath("/admin/users");
}

export async function creditAdjustmentAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const targetId = String(formData.get("userId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const description = String(formData.get("description") ?? "").trim();
  if (!targetId || !Number.isInteger(amount) || amount === 0) return;

  await manualCreditAdjustment({
    adminUserId: session.user.id,
    targetUserId: targetId,
    amount,
    description: description || undefined,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/credits");
}
