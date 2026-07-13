import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@isansausage.com" },
    update: {},
    create: {
      name: "ผู้ดูแลระบบ",
      email: "admin@isansausage.com",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@isansausage.com" },
    update: {},
    create: {
      name: "พนักงาน",
      email: "staff@isansausage.com",
      passwordHash: await bcrypt.hash("staff123456", 12),
      role: UserRole.STAFF,
    },
  });

  const pork = await prisma.rawMaterial.upsert({
    where: { id: "seed-pork" },
    update: {},
    create: {
      id: "seed-pork",
      name: "เนื้อหมู",
      unit: "กก.",
      quantity: 100,
      minStockAlert: 20,
      costPerUnit: 150,
    },
  });

  const stickyRice = await prisma.rawMaterial.upsert({
    where: { id: "seed-rice" },
    update: {},
    create: {
      id: "seed-rice",
      name: "ข้าวเหนียว",
      unit: "กก.",
      quantity: 50,
      minStockAlert: 10,
      costPerUnit: 35,
    },
  });

  const garlic = await prisma.rawMaterial.upsert({
    where: { id: "seed-garlic" },
    update: {},
    create: {
      id: "seed-garlic",
      name: "กระเทียม",
      unit: "กก.",
      quantity: 10,
      minStockAlert: 2,
      costPerUnit: 80,
    },
  });

  const spice = await prisma.rawMaterial.upsert({
    where: { id: "seed-spice" },
    update: {},
    create: {
      id: "seed-spice",
      name: "เครื่องเทศ",
      unit: "กก.",
      quantity: 5,
      minStockAlert: 1,
      costPerUnit: 200,
    },
  });

  const casing = await prisma.rawMaterial.upsert({
    where: { id: "seed-casing" },
    update: {},
    create: {
      id: "seed-casing",
      name: "ไส้บรรจุ",
      unit: "ม.",
      quantity: 500,
      minStockAlert: 100,
      costPerUnit: 2,
    },
  });

  await prisma.product.upsert({
    where: { id: "seed-product-1" },
    update: {},
    create: {
      id: "seed-product-1",
      name: "ไส้กรอกอีสาน สูตรดั้งเดิม",
      recipe: [
        { rawMaterialId: pork.id, quantityPerUnit: 0.5 },
        { rawMaterialId: stickyRice.id, quantityPerUnit: 0.2 },
        { rawMaterialId: garlic.id, quantityPerUnit: 0.05 },
        { rawMaterialId: spice.id, quantityPerUnit: 0.02 },
        { rawMaterialId: casing.id, quantityPerUnit: 0.3 },
      ],
      quantity: 30,
      minStockAlert: 20,
      expiryDays: 7,
    },
  });

  await prisma.product.upsert({
    where: { id: "seed-product-2" },
    update: {},
    create: {
      id: "seed-product-2",
      name: "ไส้กรอกอีสาน ไซส์ใหญ่",
      recipe: [
        { rawMaterialId: pork.id, quantityPerUnit: 0.8 },
        { rawMaterialId: stickyRice.id, quantityPerUnit: 0.3 },
        { rawMaterialId: garlic.id, quantityPerUnit: 0.08 },
        { rawMaterialId: spice.id, quantityPerUnit: 0.03 },
        { rawMaterialId: casing.id, quantityPerUnit: 0.5 },
      ],
      quantity: 15,
      minStockAlert: 10,
      expiryDays: 7,
    },
  });

  console.log("Seed completed!");
  console.log("Admin:", admin.email, "/ admin123456");
  console.log("Staff:", staff.email, "/ staff123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
