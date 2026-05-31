"use server";

import { revalidatePath } from "next/cache";

import { createProject } from "@/lib/projects/service";
import { requireVerifiedUser } from "@/lib/session";
import { createProjectSchema } from "@/lib/validations/render";

export async function createProjectAction(formData: FormData) {
  const { user } = await requireVerifiedUser();
  const parsed = createProjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return;
  await createProject(user.id, parsed.data.name);
  revalidatePath("/projects");
}
