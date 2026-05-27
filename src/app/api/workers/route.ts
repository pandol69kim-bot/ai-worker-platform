import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createWorkerSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  category: z.string(),
  roleDefinition: z.string().min(10),
  workflow: z.string().min(10),
  prompt: z.string().min(10),
  rules: z.string().optional(),
  outputFormat: z.string().optional(),
  price: z.number().min(0).default(0),
  priceType: z.enum(["free", "one_time", "subscription"]).default("free"),
  tags: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") ?? "latest";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "12");
  const status = searchParams.get("status");

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  const where: Record<string, unknown> = {};

  if (!status || status === "published") {
    where.status = "published";
  } else if (user?.role === "admin") {
    if (status !== "all") where.status = status;
  }

  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> =
    sort === "popular"
      ? { totalSales: "desc" }
      : sort === "rating"
      ? { avgRating: "desc" }
      : { createdAt: "desc" };

  const [workers, total] = await Promise.all([
    db.aIWorker.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        maker: { select: { id: true, name: true, image: true } },
      },
    }),
    db.aIWorker.count({ where }),
  ]);

  return NextResponse.json({ workers, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = session.user as { id: string; role?: string };

  try {
    const body = await req.json();
    const data = createWorkerSchema.parse(body);

    const worker = await db.aIWorker.create({
      data: {
        ...data,
        makerId: user.id,
        status: "draft",
      },
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
