import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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

  const where: Prisma.ExecutionWhereInput = {};

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (search) {
    // user 관계가 없으므로 사용자 검색은 User 테이블에서 ID 먼저 조회
    const matchedUsers = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    const matchedUserIds = matchedUsers.map((u) => u.id);

    where.OR = [
      { worker: { title: { contains: search, mode: "insensitive" } } },
      ...(matchedUserIds.length > 0 ? [{ userId: { in: matchedUserIds } }] : []),
    ];
  }

  const [executions, total] = await Promise.all([
    db.execution.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        worker: { select: { id: true, title: true, category: true } },
      },
    }),
    db.execution.count({ where }),
  ]);

  const hasMore = executions.length > limit;
  const items = hasMore ? executions.slice(0, limit) : executions;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor, total });
}
