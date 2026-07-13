import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  createAuditLog,
  createStockMovement,
  checkLowStockNotifications,
  decimalToNumber,
} from "./helpers";

export async function listRawMaterials() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: { name: "asc" },
  });
  return materials.map((m) => ({
    ...m,
    quantity: decimalToNumber(m.quantity),
    minStockAlert: decimalToNumber(m.minStockAlert),
    costPerUnit: decimalToNumber(m.costPerUnit),
    isLowStock: decimalToNumber(m.quantity) <= decimalToNumber(m.minStockAlert),
  }));
}

export async function getRawMaterial(id: string) {
  const material = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!material) throw new AppError(404, "Raw material not found");
  return {
    ...material,
    quantity: decimalToNumber(material.quantity),
    minStockAlert: decimalToNumber(material.minStockAlert),
    costPerUnit: decimalToNumber(material.costPerUnit),
  };
}

export async function createRawMaterial(
  data: {
    name: string;
    unit: string;
    quantity?: number;
    minStockAlert: number;
    costPerUnit: number;
  },
  userId: string
) {
  const material = await prisma.rawMaterial.create({
    data: {
      name: data.name,
      unit: data.unit,
      quantity: data.quantity ?? 0,
      minStockAlert: data.minStockAlert,
      costPerUnit: data.costPerUnit,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    tableName: "RawMaterial",
    recordId: material.id,
    newValue: material,
  });

  if (data.quantity && data.quantity > 0) {
    await createStockMovement({
      itemType: "RAW_MATERIAL",
      itemId: material.id,
      type: "IN",
      quantity: data.quantity,
      reason: "Initial stock",
      userId,
    });
  }

  await checkLowStockNotifications();
  return getRawMaterial(material.id);
}

export async function updateRawMaterial(
  id: string,
  data: Partial<{
    name: string;
    unit: string;
    minStockAlert: number;
    costPerUnit: number;
  }>,
  userId: string
) {
  const existing = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Raw material not found");

  const material = await prisma.rawMaterial.update({
    where: { id },
    data,
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    tableName: "RawMaterial",
    recordId: id,
    oldValue: existing,
    newValue: material,
  });

  await checkLowStockNotifications();
  return getRawMaterial(id);
}

export async function deleteRawMaterial(id: string, userId: string) {
  const existing = await prisma.rawMaterial.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Raw material not found");

  await prisma.rawMaterial.delete({ where: { id } });

  await createAuditLog({
    userId,
    action: "DELETE",
    tableName: "RawMaterial",
    recordId: id,
    oldValue: existing,
  });
}

export async function adjustRawMaterialStock(
  id: string,
  quantity: number,
  reason: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const material = await tx.rawMaterial.findUnique({ where: { id } });
    if (!material) throw new AppError(404, "Raw material not found");

    const newQty = decimalToNumber(material.quantity) + quantity;
    if (newQty < 0) throw new AppError(400, "Insufficient stock");

    const updated = await tx.rawMaterial.update({
      where: { id },
      data: { quantity: newQty },
    });

    await tx.stockMovement.create({
      data: {
        itemType: "RAW_MATERIAL",
        itemId: id,
        type: "ADJUST",
        quantity: Math.abs(quantity),
        reason,
        userId,
      },
    });

    await createAuditLog({
      userId,
      action: "ADJUST_STOCK",
      tableName: "RawMaterial",
      recordId: id,
      oldValue: { quantity: material.quantity },
      newValue: { quantity: updated.quantity },
    });

    return {
      ...updated,
      quantity: decimalToNumber(updated.quantity),
      minStockAlert: decimalToNumber(updated.minStockAlert),
      costPerUnit: decimalToNumber(updated.costPerUnit),
    };
  });
}
