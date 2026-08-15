/**
 * Prisma seed script.
 * Run: npx prisma db seed
 * Creates 2 seed users: admin@example.com and user@example.com (both Password123!)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // ── First user → Admin ────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      fullName: "Admin User",
      roles: {
        create: { role: "admin" },
      },
    },
  });
  console.log(`✅ Admin user: ${admin.email} (id: ${admin.id})`);

  // ── Second user → Regular user ────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash,
      fullName: "Test User",
      roles: {
        create: { role: "user" },
      },
    },
  });
  console.log(`✅ Regular user: ${user.email} (id: ${user.id})`);

  // ── Sample complaints ──────────────────────────────────────────────────────
  await prisma.complaint.upsert({
    where: { id: "seed-complaint-1" },
    update: {},
    create: {
      id: "seed-complaint-1",
      userId: user.id,
      title: "Incorrect Billing Charge on Invoice #4092",
      description:
        "I was double charged $49.99 for the monthly subscription. Please refund the duplicate transaction.",
      category: "billing",
      priority: "high",
      status: "open",
      aiReason:
        "Categorized as billing due to invoice inquiry. Priority high due to financial dispute.",
      aiClassified: true,
    },
  });

  await prisma.complaint.upsert({
    where: { id: "seed-complaint-2" },
    update: {},
    create: {
      id: "seed-complaint-2",
      userId: user.id,
      title: "Dashboard Page Slow Load Time",
      description:
        "The analytics dashboard takes more than 8 seconds to render graphs on Chrome.",
      category: "technical",
      priority: "medium",
      status: "in_progress",
      aiReason: "Technical issue regarding UI render performance.",
      aiClassified: true,
    },
  });

  console.log("✅ Sample complaints created");
  console.log("\n🎉 Seeding complete!");
  console.log("  Admin:   admin@example.com / Password123!");
  console.log("  User:    user@example.com  / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
