"use server";

import { revalidatePath } from "next/cache";

import { setUserDisabled, setUserRole } from "@/lib/admin/service";
import { requireAdmin } from "@/lib/session";

export async function toggleDisableAction(formData: FormData) {
  const session = await requireAdmin();
  const targetId = String(formData.get("userId") ?? "");
  const disabled = formData.get("disabled") === "true";
  if (!targetId || targetId === session.user.id) return; // never disable self
  await setUserDisabled(session.user.id, targetId, disabled);
  revalidatePath("/admin/users");
}

export async function setRoleAction(formData: FormData) {
  const session = await requireAdmin();
  const targetId = String(formData.get("userId") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "user";
  if (!targetId || targetId === session.user.id) return; // never demote self
  await setUserRole(session.user.id, targetId, role);
  revalidatePath("/admin/users");
}
