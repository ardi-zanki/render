"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  updateUserPreferences,
  updateUserProfileDisplayName,
} from "@/lib/account/service";
import { auth } from "@/lib/auth";
import { zodFieldErrors } from "@/lib/form";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireVerifiedUser } from "@/lib/session";
import { preferencesSchema, profileSchema } from "@/lib/validations/account";

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
    emailNotificationsEnabled: formData.get("emailNotificationsEnabled") === "on",
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
