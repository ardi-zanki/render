import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { creditTransactions } from "@/db/schema";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || !session.user.emailVerified) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const rows = await db.query.creditTransactions.findMany({
    where: eq(creditTransactions.userId, session.user.id),
    orderBy: desc(creditTransactions.createdAt),
    limit: 100,
  });

  return NextResponse.json({ transactions: rows });
}
