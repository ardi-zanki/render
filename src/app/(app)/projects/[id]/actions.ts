"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { archiveProject } from "@/lib/projects/service";
import { requireVerifiedUser } from "@/lib/session";

export async function archiveProjectAction(projectId: string) {
  const { user } = await requireVerifiedUser();
  await archiveProject(user.id, projectId);
  revalidatePath("/projects");
  redirect("/projects");
}
