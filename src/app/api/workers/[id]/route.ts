import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  AI_PROVIDER_OPTIONS,
  DEFAULT_AI_MODEL_BY_PROVIDER,
  isSupportedAIModel,
} from "@/lib/ai/catalog";
import { normalizeCategoryInput } from "@/lib/utils";
import { z } from "zod";

const categorySchema = z
  .string()
  .trim()
  .min(1, "카테고리를 입력해 주세요.")
  .max(30, "카테고리는 30자 이하로 입력해 주세요.")
  .transform((value) => normalizeCategoryInput(value))
  .refine((value) => value.length > 0, "카테고리를 입력해 주세요.");

const aiProviderSchema = z.enum(AI_PROVIDER_OPTIONS.map((provider) => provider.value) as [typeof AI_PROVIDER_OPTIONS[number]["value"], ...typeof AI_PROVIDER_OPTIONS[number]["value"][]]);

const updateWorkerSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: categorySchema.optional(),
  aiProvider: aiProviderSchema.optional(),
  aiModel: z.string().min(1).max(100).optional(),
  roleDefinition: z.string().min(10).optional(),
  workflow: z.string().min(10).optional(),
  prompt: z.string().min(10).optional(),
  rules: z.string().optional(),
  outputFormat: z.string().optional(),
  price: z.number().min(0).optional(),
  priceType: z.enum(["free", "one_time", "subscription"]).optional(),
  tags: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const worker = await db.aIWorker.findUnique({
    where: { id },
    include: {
      maker: { select: { id: true, name: true, image: true, makerProfile: true } },
      reviews: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!worker) {
    return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
  }

  await db.aIWorker.update({
    where: { id },
    data: { totalViews: { increment: 1 } },
  });

  return NextResponse.json(worker);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id: string; role?: string };

  const worker = await db.aIWorker.findUnique({ where: { id } });
  if (!worker) {
    return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (worker.makerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateWorkerSchema.parse(body);
    const nextProvider = data.aiProvider ?? worker.aiProvider;
    const nextModel = data.aiModel ?? DEFAULT_AI_MODEL_BY_PROVIDER[nextProvider as keyof typeof DEFAULT_AI_MODEL_BY_PROVIDER] ?? worker.aiModel;

    if (!isSupportedAIModel(nextProvider, nextModel)) {
      return NextResponse.json({ error: "선택한 AI 제공자에서 지원하지 않는 모델입니다." }, { status: 400 });
    }

    const updated = await db.aIWorker.update({
      where: { id },
      data: {
        ...data,
        aiProvider: nextProvider,
        aiModel: nextModel,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[PATCH /api/workers/:id] Unexpected error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `서버 오류: ${message}` }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id: string; role?: string };

  const worker = await db.aIWorker.findUnique({ where: { id } });
  if (!worker) {
    return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (worker.makerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!["draft", "rejected"].includes(worker.status)) {
    return NextResponse.json({ error: "초안 또는 반려된 AI 직원만 삭제할 수 있습니다." }, { status: 400 });
  }

  await db.aIWorker.delete({ where: { id } });

  return NextResponse.json({ message: "삭제되었습니다." });
}
