import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  countProjects,
  createProject,
  MAX_PROJECTS,
} from "@/lib/projects/service";
import { zodFieldErrors } from "@/lib/form";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { createProjectSchema } from "@/lib/validations/render";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  try {
    await assertRateLimit("public_api", session.user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, code: err.code, message: err.message },
        { status: 429 },
      );
    }
    throw err;
  }

  const parsed = createProjectSchema.safeParse(
    await req.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Input tidak valid",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  if ((await countProjects(session.user.id)) >= MAX_PROJECTS) {
    return NextResponse.json(
      { error: `Maksimal ${MAX_PROJECTS} project per akun.` },
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
