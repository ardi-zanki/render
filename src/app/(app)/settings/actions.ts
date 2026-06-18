"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  hasGoogleAccount,
  hasPasswordAccount,
  updateUserPreferences,
  updateUserProfileDisplayName,
  unlinkGoogleAccount,
} from "@/lib/account/service";
import { auth } from "@/lib/auth";
import { zodFieldErrors } from "@/lib/form";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireVerifiedUser } from "@/lib/session";
import {
  preferencesSchema,
  profileSchema,
  setPasswordSchema,
} from "@/lib/validations/account";

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    displayName: formData.get("displayName") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error) };
  }

  // Update name through Better Auth so the session reflects it immediately.
  await auth.api.updateUser({
    body: { name: parsed.data.name },
    headers: await headers(),
  });

  await updateUserProfileDisplayName(user.id, parsed.data.displayName);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePreferencesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsed = preferencesSchema.safeParse({
    defaultRenderMode: formData.get("defaultRenderMode"),
    defaultOutputFormat: formData.get("defaultOutputFormat"),
  });
  if (!parsed.success) {
    return { error: "Input tidak valid" };
  }

  await updateUserPreferences(user.id, parsed.data);

  revalidatePath("/settings");
  return { ok: true };
}

export async function setPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsed = setPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error) };
  }

  if (await hasPasswordAccount(user.id)) {
    return { error: "Password sudah aktif. Gunakan form ganti password." };
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: parsed.data.newPassword },
      headers: await headers(),
    });
  } catch {
    return { error: "Gagal membuat password. Silakan coba lagi." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function disconnectGoogleAction(): Promise<ActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);

  const [googleConnected, passwordReady] = await Promise.all([
    hasGoogleAccount(user.id),
    hasPasswordAccount(user.id),
  ]);

  if (!googleConnected) {
    return { error: "Akun Google belum terhubung." };
  }
  if (!passwordReady) {
    return {
      error:
        "Buat password terlebih dahulu sebelum melepas akun Google agar Anda tetap bisa login.",
    };
  }

  await unlinkGoogleAccount(user.id);

  revalidatePath("/", "layout");
  return { ok: true };
}
