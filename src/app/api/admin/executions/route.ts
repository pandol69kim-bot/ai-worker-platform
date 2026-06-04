import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = 20;
  const statusFilter = searchParams.get("status")?.trim() ?? "";
  const search = searchParams.get("search")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (search) {
    where.OR = [
      { worker: { title: { contains: search, mode: "insensitive" as const } } },
      { user: { email: { contains: search, mode: "insensitive" as const } } },
      { user: { name: { contains: search, mode: "insensitive" as const } } },
    ];
  }

  const executions = await db.execution.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      worker: { select: { id: true, title: true, category: true } },
    },
  });

  const hasMore = executions.length > limit;
  const items = hasMore ? executions.slice(0, limit) : executions;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  const total = await db.execution.count({ where });

  return NextResponse.json({ items, nextCursor, total });
}
