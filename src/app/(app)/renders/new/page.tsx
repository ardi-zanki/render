import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { RenderStudio } from "@/components/app/render-studio";
import type { RenderOutputFormat } from "@/db/schema";
import { getUserProfile } from "@/lib/account/service";
import { getBalance } from "@/lib/credits";
import {
  getDefaultProject,
  getProject,
  listProjects,
} from "@/lib/projects/service";
import { listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Render Studio" };

const OUTPUT_FORMATS = new Set<RenderOutputFormat>([
  "jpg",
  "png",
  "webp",
  "avif",
]);

function defaultOutputFormat(value: string | null | undefined): RenderOutputFormat {
  return value && OUTPUT_FORMATS.has(value as RenderOutputFormat)
    ? (value as RenderOutputFormat)
    : "jpg";
}

export default async function CreateRenderPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; prompt?: string }>;
}) {
  const { user } = await requireVerifiedUser();
  const { project: projectParam, prompt } = await searchParams;

  const selected = projectParam
    ? await getProject(user.id, projectParam)
    : null;
  const project = selected ?? (await getDefaultProject(user.id));

  const [balance, scenes, projects, profile] = await Promise.all([
    getBalance(user.id),
    listRenders(user.id, { projectId: project.id, limit: 12 }),
    listProjects(user.id),
    getUserProfile(user.id),
  ]);

  return (
    <>
      <PageHeader
        title="Render Studio"
        description="Upload desain, atur konteks visual, lalu buat hasil render yang tersimpan ke project."
      />
      <RenderStudio
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
        defaultRenderMode={profile?.defaultRenderMode ?? "interior"}
        defaultOutputFormat={defaultOutputFormat(profile?.defaultOutputFormat)}
        initialInstruction={prompt ?? ""}
      />
    </>
  );
}
