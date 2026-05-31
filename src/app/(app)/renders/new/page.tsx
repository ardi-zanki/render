import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { RendrStudio } from "@/components/app/rendr-studio";
import { getBalance } from "@/lib/credits";
import { getDefaultProject } from "@/lib/projects/service";
import { listRenders } from "@/lib/renders/service";
import { requireVerifiedUser } from "@/lib/session";

export const metadata: Metadata = { title: "Rendr Studio" };

export default async function CreateRenderPage() {
  const { user } = await requireVerifiedUser();
  const project = await getDefaultProject(user.id);
  const [balance, scenes] = await Promise.all([
    getBalance(user.id),
    listRenders(user.id, { projectId: project.id, limit: 12 }),
  ]);

  return (
    <>
      <PageHeader
        title="Rendr Studio"
        description="Upload desain, atur konteks & lighting, lalu Gass Render!"
      />
      <RendrStudio
        projectId={project.id}
        projectName={project.name}
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
