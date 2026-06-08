"use server";

import { revalidatePath } from "next/cache";

import {
  archiveProject,
  countProjects,
  createProject,
  deleteProject,
  MAX_PROJECTS,
  unarchiveProject,
  updateProject,
} from "@/lib/projects/service";
import { assertRateLimit } from "@/lib/rate-limit";
import { requireVerifiedUser } from "@/lib/session";
import { projectIdSchema } from "@/lib/validations/api";
import { createProjectSchema } from "@/lib/validations/render";

export type ProjectActionState = { ok?: boolean; error?: string; id?: string };

export async function createProjectAction(input: {
  name: string;
  description?: string;
}): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }
  if ((await countProjects(user.id)) >= MAX_PROJECTS) {
    return { error: `Maksimal ${MAX_PROJECTS} project per akun.` };
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
  await assertRateLimit("public_api", user.id);
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "ID project tidak valid" };
  }
  const parsed = createProjectSchema.safeParse({ name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  }
  const projectId = parsedId.data;
  await updateProject(
    user.id,
    projectId,
    parsed.data.name,
    parsed.data.description,
  );
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function archiveProjectAction(
  id: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "ID project tidak valid" };
  }
  const ok = await archiveProject(user.id, parsedId.data);
  revalidatePath("/projects");
  return ok ? { ok: true } : { error: "Project default tidak bisa diarsip." };
}

export async function unarchiveProjectAction(
  id: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "ID project tidak valid" };
  }
  await unarchiveProject(user.id, parsedId.data);
  revalidatePath("/projects");
  return { ok: true };
}

export async function deleteProjectAction(
  id: string,
): Promise<ProjectActionState> {
  const { user } = await requireVerifiedUser();
  await assertRateLimit("public_api", user.id);
  const parsedId = projectIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { error: "ID project tidak valid" };
  }
  const res = await deleteProject(user.id, parsedId.data);
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
