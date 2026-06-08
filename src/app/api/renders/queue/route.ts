import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { projects, renderJobs, renders } from "@/db/schema";
import { auth } from "@/lib/auth";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    await assertRateLimit("public_api", userId);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 429 },
      );
    }
    throw err;
  }

  const activeQueueWhere = and(
    eq(renderJobs.userId, userId),
    inArray(renderJobs.status, ["queued", "processing"]),
    isNull(renders.deletedAt),
  );
  const [totalRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(renderJobs)
      .innerJoin(renders, eq(renderJobs.renderId, renders.id))
      .where(activeQueueWhere),
    db
      .select({
        id: renderJobs.id,
        renderId: renderJobs.renderId,
        status: renderJobs.status,
        attempts: renderJobs.attempts,
        mode: renders.mode,
        prompt: renders.prompt,
        projectName: projects.name,
        createdAt: renderJobs.createdAt,
        startedAt: renderJobs.startedAt,
      })
      .from(renderJobs)
      .innerJoin(renders, eq(renderJobs.renderId, renders.id))
      .innerJoin(projects, eq(renders.projectId, projects.id))
      .where(activeQueueWhere)
      .orderBy(desc(renderJobs.createdAt))
      .limit(20),
  ]);

  return NextResponse.json({
    count: totalRow[0]?.value ?? rows.length,
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      startedAt: row.startedAt?.toISOString() ?? null,
    })),
  });
}
