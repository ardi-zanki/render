"use server";

import { revalidatePath } from "next/cache";

import {
  archiveProject,
  createProject,
  deleteProject,
  unarchiveProject,
  updateProject,
} from "@/lib/projects/service";
import { requireVerifiedUser } from "@/lib/session";
import { createProjectSchema } from "@/lib/validations/render";

export type ProjectActionState = { ok?: boolean; error?: string; id?: string };

export async function createProjectAction(input: {
  name: string;
  description?: string;
}): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }
  const p = await createProject(
    user.id,
    parsed.data.name,
    parsed.data.description,
  );
  revalidatePath("/projects");
  return { ok: true, id: p.id };
}

export async function updateProjectAction(
  id: string,
  name: string,
  description?: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  const parsed = createProjectSchema.safeParse({ name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }
  await updateProject(user.id, id, parsed.data.name, parsed.data.description);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function archiveProjectAction(
  id: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  const ok = await archiveProject(user.id, id);
  revalidatePath("/projects");
  return ok ? { ok: true } : { error: "Project default tidak bisa diarsip." };
}

export async function unarchiveProjectAction(
  id: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  await unarchiveProject(user.id, id);
  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteProjectAction(
  id: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  const res = await deleteProject(user.id, id);
  revalidatePath("/projects");
  if (res.deleted) return { ok: true };
  const msg =
    res.reason === "has_renders"
      ? "Project masih punya render, tidak bisa dihapus."
      : res.reason === "default"
        ? "Project default tidak bisa dihapus."
        : "Project tidak ditemukan.";
  return { error: msg };
}
