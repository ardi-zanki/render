import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { env } from "@/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({
      ok: true,
      service: "renderai",
      aiProvider: env.AI_PROVIDER,
      renderProcessingMode: env.RENDER_PROCESSING_MODE,
      storageProvider: env.STORAGE_PROVIDER,
    });
  } catch {
    return NextResponse.json(
      { ok: false, service: "renderai" },
      { status: 503 },
    );
  }
}
