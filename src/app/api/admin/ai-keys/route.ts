import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { maskApiKey } from "@/lib/ai/keys";
import { AI_PROVIDER_OPTIONS } from "@/lib/ai/catalog";

const PROVIDERS = AI_PROVIDER_OPTIONS.map((p) => p.value) as [string, ...string[]];

const upsertSchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1, "API 키를 입력해주세요."),
  isActive: z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return user?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const keys = await db.aIProviderKey.findMany({
    orderBy: { provider: "asc" },
    select: { id: true, provider: true, apiKey: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json(
    keys.map((k) => ({ ...k, apiKey: maskApiKey(k.apiKey) }))
  );
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { provider, apiKey, isActive } = parsed.data;

  const key = await db.aIProviderKey.upsert({
    where: { provider },
    create: { provider, apiKey, isActive },
    update: { apiKey, isActive },
    select: { id: true, provider: true, apiKey: true, isActive: true, updatedAt: true },
  });

  return NextResponse.json({ ...key, apiKey: maskApiKey(key.apiKey) });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { provider } = await req.json();
  if (!provider) {
    return NextResponse.json({ error: "provider가 필요합니다." }, { status: 400 });
  }

  await db.aIProviderKey.deleteMany({ where: { provider } });

  return NextResponse.json({ ok: true });
}
