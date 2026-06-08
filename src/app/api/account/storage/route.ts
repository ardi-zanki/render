import { NextResponse } from "next/server";

import {
  clearUserRenderStorage,
  getUserStorageUsage,
} from "@/lib/storage/usage";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

async function requireApiUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  if (!session.user.emailVerified) return null;
  return session.user;
}

export async function GET(req: Request) {
  const user = await requireApiUser(req);
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  return NextResponse.json(await getUserStorageUsage(user.id));
}

export async function DELETE(req: Request) {
  const user = await requireApiUser(req);
  if (!user) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }
  const result = await clearUserRenderStorage(user.id);
  return NextResponse.json({
    ...result,
    usage: await getUserStorageUsage(user.id),
  });
}
