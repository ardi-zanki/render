import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { RendrStudio } from "@/components/app/rendr-studio";
import { getBalance } from "@/lib/credits";
import {
  getDefaultProject,
  getProject,
  listProjects,
} from "@/lib/projects/service";
import { listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Rendr Studio" };

export default async function CreateRenderPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { project: projectParam } = await searchParams;

  const selected = projectParam
    ? await getProject(user.id, projectParam)
    : null;
  const project = selected ?? (await getDefaultProject(user.id));

  const [balance, scenes, projects] = await Promise.all([
    getBalance(user.id),
    listRenders(user.id, { projectId: project.id, limit: 12 }),
    listProjects(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Rendr Studio"
        description="Upload desain, atur konteks & lighting, lalu Gass Render!"
      />
      <RendrStudio
        key={project.id}
        projectId={project.id}
        projectName={project.name}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        initialBalance={balance}
        initialScenes={scenes.map((s) => ({
          id: s.id,
          mode: s.mode,
          status: s.status,
          resultUrl: s.resultUrl,
        }))}
      />
    </>
  );
}
