"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { archiveProject } from "@/lib/projects/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireVerifiedUser } from "@/lib/session";
import { projectIdSchema } from "@/lib/validations/api";

export async function archiveProjectAction(projectId: string) {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsedId = projectIdSchema.safeParse(projectId);
  if (!parsedId.success) {
    redirect("/projects");
  }
  await archiveProject(user.id, parsedId.data);
  revalidatePath("/projects");
  redirect("/projects");
}
