import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface RecipeItem {
  rawMaterialId: string;
  quantityPerUnit: number;
}

export function parseRecipe(recipe: unknown): RecipeItem[] {
  if (!Array.isArray(recipe)) return [];
  return recipe as RecipeItem[];
}

export async function createAuditLog(params: {
  userId: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      oldValue: params.oldValue as Prisma.InputJsonValue | undefined,
      newValue: params.newValue as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createStockMovement(params: {
  itemType: "RAW_MATERIAL" | "PRODUCT";
  itemId: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  reason?: string;
  userId: string;
}) {
  await prisma.stockMovement.create({
    data: {
      itemType: params.itemType,
      itemId: params.itemId,
      type: params.type,
      quantity: params.quantity,
      reason: params.reason,
      userId: params.userId,
    },
  });
}

export async function notifyAdmins(title: string, message: string, type: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      title,
      message,
      type,
    })),
  });
}

export async function checkLowStockNotifications() {
  const [materials, products] = await Promise.all([
    prisma.rawMaterial.findMany(),
    prisma.product.findMany(),
  ]);

  const lowMaterials = materials.filter(
    (m) => decimalToNumber(m.quantity) <= decimalToNumber(m.minStockAlert)
  );

  const lowProducts = products.filter(
    (p) => decimalToNumber(p.quantity) <= decimalToNumber(p.minStockAlert)
  );

  await Promise.all([
    ...lowMaterials.map((material) =>
      notifyAdmins(
        "สต็อกวัตถุดิบต่ำ",
        `${material.name} เหลือ ${decimalToNumber(material.quantity)} ${material.unit} (ต่ำกว่า ${decimalToNumber(material.minStockAlert)})`,
        "LOW_STOCK_RAW"
      )
    ),
    ...lowProducts.map((product) =>
      notifyAdmins(
        "สต็อกสินค้าต่ำ",
        `${product.name} เหลือ ${decimalToNumber(product.quantity)} ชิ้น (ต่ำกว่า ${decimalToNumber(product.minStockAlert)})`,
        "LOW_STOCK_PRODUCT"
      )
    ),
  ]);
}

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : Number(value);
}
