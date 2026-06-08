"use server";

import { revalidatePath } from "next/cache";

import {
  manualCreditAdjustment,
  setUserDisabled,
  setUserRole,
} from "@/lib/admin/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireAdmin, requireRecentAuth } from "@/lib/session";
import {
  adminCreditAdjustmentSchema,
  adminSetRoleSchema,
  adminToggleDisableSchema,
} from "@/lib/validations/api";

export async function toggleDisableAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const parsed = adminToggleDisableSchema.safeParse({
    userId: formData.get("userId"),
    disabled: formData.get("disabled"),
  });
  if (!parsed.success) return;
  const { userId: targetId, disabled } = parsed.data;
  if (!targetId || targetId === session.user.id) return; // never disable self
  await setUserDisabled(session.user.id, targetId, disabled);
  revalidatePath("/admin/users");
}

export async function setRoleAction(formData: FormData) {
  const session = await requireAdmin();
  await assertRateLimit("admin_action", session.user.id);
  const parsed = adminSetRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;
  const { userId: targetId, role } = parsed.data;
  if (!targetId || targetId === session.user.id) return; // never demote self
  await setUserRole(session.user.id, targetId, role);
  revalidatePath("/admin/users");
}

export async function creditAdjustmentAction(formData: FormData) {
  const session = await requireAdmin();
  // Manual credit adjustment moves money — require a recent login (PRD §10.1).
  await requireRecentAuth();
  await assertRateLimit("admin_action", session.user.id);
  const parsed = adminCreditAdjustmentSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });
  if (!parsed.success) return;
  const { userId: targetId, amount, description } = parsed.data;

  await manualCreditAdjustment({
    adminUserId: session.user.id,
    targetUserId: targetId,
    amount,
    description,
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/credits");
}
