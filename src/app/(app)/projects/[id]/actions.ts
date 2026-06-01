"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { archiveProject, renameProject } from "@/lib/projects/service";
import { requireVerifiedUser } from "@/lib/session";
import { createProjectSchema } from "@/lib/validations/render";

export async function renameProjectAction(formData: FormData) {
  const { user } = await requireVerifiedUser();
  const id = String(formData.get("projectId") ?? "");
  const parsed = createProjectSchema.safeParse({ name: formData.get("name") });
  if (!id || !parsed.success) return;
  await renameProject(user.id, id, parsed.data.name);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function archiveProjectAction(projectId: string) {
  const { user } = await requireVerifiedUser();
  await archiveProject(user.id, projectId);
  revalidatePath("/projects");
  redirect("/projects");
}
