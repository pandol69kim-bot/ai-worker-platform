import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { executeAIWorker } from "@/lib/openai";
import { z } from "zod";

const executeSchema = z.object({
  workerId: z.string(),
  input: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string } | undefined;

  try {
    const body = await req.json();
    const { workerId, input } = executeSchema.parse(body);

    const worker = await db.aIWorker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
    }

    if (worker.status !== "published" && worker.priceType !== "free") {
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

      if (!purchase && worker.makerId !== user.id) {
        return NextResponse.json({ error: "이 AI 직원을 사용하려면 구매가 필요합니다." }, { status: 403 });
      }
    }

    const execution = await db.execution.create({
      data: {
        workerId,
        userId: user?.id,
        input,
        status: "running",
      },
    });

    const startTime = Date.now();

    try {
      const { output, tokens } = await executeAIWorker(
        worker.prompt,
        worker.roleDefinition,
        worker.workflow,
        worker.rules,
        input
      );

      const duration = Date.now() - startTime;

      await db.execution.update({
        where: { id: execution.id },
        data: { output, tokens, duration, status: "completed" },
      });

      return NextResponse.json({ output, tokens, duration, executionId: execution.id });
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
    console.error("Execute error:", error);
    return NextResponse.json({ error: "AI 실행 중 오류가 발생했습니다." }, { status: 500 });
  }
}
