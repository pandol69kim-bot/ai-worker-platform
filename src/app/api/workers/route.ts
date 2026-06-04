import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_AI_MODEL_BY_PROVIDER,
  DEFAULT_AI_PROVIDER,
  isSupportedAIModel,
} from "@/lib/ai/catalog";
import { getCategoryMatchValues, normalizeCategoryInput } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const categorySchema = z
  .string()
  .trim()
  .min(1, "카테고리를 입력해 주세요.")
  .max(30, "카테고리는 30자 이하로 입력해 주세요.")
  .transform((value) => normalizeCategoryInput(value))
  .refine((value) => value.length > 0, "카테고리를 입력해 주세요.");

const aiProviderSchema = z.enum(AI_PROVIDER_OPTIONS.map((provider) => provider.value) as [typeof AI_PROVIDER_OPTIONS[number]["value"], ...typeof AI_PROVIDER_OPTIONS[number]["value"][]]);

const createWorkerSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  category: categorySchema,
  aiProvider: aiProviderSchema.default(DEFAULT_AI_PROVIDER),
  aiModel: z.string().min(1).max(100).optional(),
  roleDefinition: z.string().min(10),
  workflow: z.string().min(10),
  prompt: z.string().min(10),
  rules: z.string().optional(),
  outputFormat: z.string().optional(),
  price: z.number().min(0).default(0),
  priceType: z.enum(["free", "one_time", "subscription"]).default("free"),
  tags: z.string().optional(),
}).transform((data) => {
  const aiModel = data.aiModel ?? DEFAULT_AI_MODEL_BY_PROVIDER[data.aiProvider];
  return { ...data, aiModel };
}).superRefine((data, ctx) => {
  if (!isSupportedAIModel(data.aiProvider, data.aiModel)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "선택한 AI 제공자에서 지원하지 않는 모델입니다.",
      path: ["aiModel"],
    });
  }
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

  if (category) {
    const categoryValues = getCategoryMatchValues(category);
    if (categoryValues.length === 1) {
      where.category = categoryValues[0];
    } else if (categoryValues.length > 1) {
      where.category = { in: categoryValues };
    }
  }
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
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "현재 로그인 세션이 만료되었습니다. 다시 로그인해 주세요." },
        { status: 401 }
      );
    }

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "현재 계정 정보를 찾을 수 없습니다. 다시 로그인한 뒤 시도해 주세요." },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
