import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { createProject } from "@/lib/projects/service";
import { createProjectSchema } from "@/lib/validations/render";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const parsed = createProjectSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nama project tidak valid" },
      { status: 400 },
    );
  }

  const project = await createProject(
    session.user.id,
    parsed.data.name,
    parsed.data.description,
  );
  return NextResponse.json({ id: project.id, name: project.name });
}
