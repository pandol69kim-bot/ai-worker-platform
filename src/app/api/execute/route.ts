import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeAIWorker } from "@/lib/ai/execute";
import { z } from "zod";

const executeSchema = z.object({
  workerId: z.string(),
  input: z.string().min(1).max(5000),
});

function getExecuteErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof error.error === "object" &&
    error.error !== null &&
    "message" in error.error &&
    typeof error.error.message === "string"
  ) {
    return error.error.message;
  }

  return "AI 실행 중 알 수 없는 오류가 발생했습니다.";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  try {
    const body = await req.json();
    const { workerId, input } = executeSchema.parse(body);

    const worker = await db.aIWorker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
    }

    const isMaker = worker.makerId === user?.id;
    const isPublished = worker.status === "published";
    const isMakerRejectedWorker = isMaker && worker.status === "rejected";

    if (!isPublished && !isMakerRejectedWorker) {
      return NextResponse.json(
        { error: "게시된 AI 직원 또는 작성자 본인의 반려 AI 직원만 실행할 수 있습니다." },
        { status: 403 }
      );
    }

    if (!isPublished && !isMaker) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (isPublished && worker.priceType !== "free") {
      if (!user?.id) {
        return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
      }

      const purchase = await db.purchase.findFirst({
        where: {
          userId: user.id,
          workerId,
          paymentStatus: "completed",
        },
      });

      if (!purchase && !isMaker) {
        return NextResponse.json({ error: "이 AI 직원을 사용하려면 구매가 필요합니다." }, { status: 403 });
      }
    }

    const execution = await db.execution.create({
      data: {
        workerId,
        userId: user?.id,
        provider: worker.aiProvider,
        model: worker.aiModel,
        input,
        status: "running",
      },
    });

    const startTime = Date.now();

    try {
      const { output, tokens, systemPrompt, provider, model } = await executeAIWorker({
        provider: worker.aiProvider,
        model: worker.aiModel,
        prompt: worker.prompt,
        roleDefinition: worker.roleDefinition,
        workflow: worker.workflow,
        rules: worker.rules,
        userInput: input,
      });

      const duration = Date.now() - startTime;

      await db.execution.update({
        where: { id: execution.id },
        data: { output, tokens, duration, provider, model, status: "completed" },
      });

      const actualPrompt =
        user?.role === "admin"
          ? `[system]\n${systemPrompt}\n\n[user]\n${input}`
          : undefined;

      return NextResponse.json({ output, tokens, duration, executionId: execution.id, actualPrompt, provider, model });
    } catch (aiError) {
      await db.execution.update({
        where: { id: execution.id },
        data: {
          status: "failed",
          error: aiError instanceof Error ? aiError.message : "AI 실행 오류",
        },
      });
      throw aiError;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    const errorMessage = getExecuteErrorMessage(error);
    console.error("Execute error:", error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
