import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbUrl = process.env.DATABASE_URL?.replace("file:", "") ?? "./dev.db";
const absolutePath = path.isAbsolute(dbUrl)
  ? dbUrl
  : path.join(process.cwd(), dbUrl.replace("./", ""));

const adapter = new PrismaBetterSqlite3({ url: absolutePath });
const db = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin1234!", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@aiworker.dev" },
    update: {},
    create: {
      name: "관리자",
      email: "admin@aiworker.dev",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log("Admin created:", admin.email);

  const makerPassword = await bcrypt.hash("maker1234!", 12);
  const maker = await db.user.upsert({
    where: { email: "maker@aiworker.dev" },
    update: {},
    create: {
      name: "김메이커",
      email: "maker@aiworker.dev",
      password: makerPassword,
      role: "maker",
    },
  });

  await db.makerProfile.upsert({
    where: { userId: maker.id },
    update: {},
    create: {
      userId: maker.id,
      bio: "마케팅 전문가로 10년 경력의 카피라이터입니다.",
      expertise: "마케팅, 카피라이팅, 브랜딩",
    },
  });
  console.log("Maker created:", maker.email);

  await db.aIWorker.upsert({
    where: { id: "seed-worker-1" },
    update: {},
    create: {
      id: "seed-worker-1",
      makerId: maker.id,
      title: "마케팅 카피 작성 전문가",
      description: "상품 설명, 광고 카피, SNS 콘텐츠 등 다양한 마케팅 문구를 전문적으로 작성합니다. 10년 경력의 카피라이터 노하우가 담긴 AI 직원입니다.",
      category: "marketing",
      roleDefinition: "당신은 10년 경력의 마케팅 카피라이터입니다. 고객의 상품이나 서비스를 가장 매력적으로 표현하는 카피를 작성합니다.",
      workflow: "1. 상품/서비스 정보 파악\n2. 타겟 고객층 분석\n3. 핵심 가치 제안(USP) 도출\n4. 여러 버전의 카피 생성\n5. 최종 검토 및 제안",
      prompt: "당신은 경험 많은 마케팅 카피라이터입니다. 고객이 제공하는 상품/서비스 정보를 바탕으로 설득력 있고 매력적인 마케팅 카피를 작성하세요.",
      rules: "반드시 한국어로 작성\n허위 또는 과장 광고 금지",
      outputFormat: "마케팅 카피 3가지 버전 제안 (짧은 버전, 중간 버전, 상세 버전)",
      price: 0,
      priceType: "free",
      status: "published",
      publishedAt: new Date(),
      tags: "마케팅,카피라이팅,SNS",
    },
  });
  console.log("Sample worker created");

  console.log("\n✅ Seed complete!");
  console.log("  Admin:  admin@aiworker.dev / admin1234!");
  console.log("  Maker:  maker@aiworker.dev / maker1234!");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
