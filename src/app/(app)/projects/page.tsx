import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import {
  ProjectsClient,
  type ProjectRow,
} from "@/components/app/projects-client";
import {
  coverImagesByProject,
  listProjects,
  renderCountsByProject,
} from "@/lib/projects/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Project" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { status } = await searchParams;
  const archived = status === "archived";

  const projects = await listProjects(user.id, { archived });
  const [counts, covers] = await Promise.all([
    renderCountsByProject(user.id),
    coverImagesByProject(
      user.id,
      projects.map((p) => p.id),
    ),
  ]);

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    coverImageUrl: covers.get(p.id) ?? null,
    isDefault: p.isDefault,
    updatedAt: p.updatedAt.toISOString(),
    renderCount: counts.get(p.id) ?? 0,
  }));

  return (
    <>
      <PageHeader
        title="Project"
        description="Kelompokkan render berdasarkan kebutuhan klien, konsep, atau ruang."
      />
      <ProjectsClient
        projects={rows}
        status={archived ? "archived" : "active"}
      />
    </>
  );
}
