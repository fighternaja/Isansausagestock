import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import {
  checkLowStockNotifications,
  createAuditLog,
  createStockMovement,
  decimalToNumber,
  parseRecipe,
  RecipeItem,
} from "./helpers";

async function validateRecipe(recipe: RecipeItem[]) {
  const ids = recipe.map((r) => r.rawMaterialId);
  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: ids } },
  });
  if (materials.length !== ids.length) {
    throw new AppError(400, "Invalid raw material in recipe");
  }
}

export async function listProducts() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const materialIds = new Set<string>();
  products.forEach((p) => {
    const recipe = parseRecipe((p as unknown as { recipe?: unknown }).recipe);
    recipe.forEach((r) => materialIds.add(r.rawMaterialId));
  });

  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: [...materialIds] } },
  });
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  return products.map((p) => {
    const recipe = parseRecipe((p as unknown as { recipe?: unknown }).recipe).map((r) => ({
      ...r,
      rawMaterialName: materialMap.get(r.rawMaterialId)?.name ?? "Unknown",
      unit: materialMap.get(r.rawMaterialId)?.unit ?? "",
    }));
    return {
      ...p,
      recipe,
      quantity: decimalToNumber(p.quantity),
      minStockAlert: decimalToNumber(p.minStockAlert),
      isLowStock: decimalToNumber(p.quantity) <= decimalToNumber(p.minStockAlert),
    };
  });
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, "Product not found");

  const recipe = parseRecipe((product as unknown as { recipe?: unknown }).recipe);
  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: recipe.map((r) => r.rawMaterialId) } },
  });
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  return {
    ...product,
    recipe: recipe.map((r) => ({
      ...r,
      rawMaterialName: materialMap.get(r.rawMaterialId)?.name ?? "Unknown",
      unit: materialMap.get(r.rawMaterialId)?.unit ?? "",
    })),
    quantity: decimalToNumber(product.quantity),
    minStockAlert: decimalToNumber(product.minStockAlert),
  };
}

export async function createProduct(
  data: {
    name: string;
    recipe: RecipeItem[];
    quantity?: number;
    minStockAlert: number;
    expiryDays: number;
  },
  userId: string
) {
  await validateRecipe(data.recipe);

  const normalizedRecipe = data.recipe.map((item) => ({
    rawMaterialId: item.rawMaterialId,
    quantityPerUnit: Number(item.quantityPerUnit),
  }));

  const product = await prisma.product.create({
    data: {
      name: data.name,
      recipe: normalizedRecipe as unknown as Prisma.InputJsonValue,
      quantity: data.quantity ?? 0,
      minStockAlert: data.minStockAlert,
      expiryDays: data.expiryDays,
    },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    tableName: "Product",
    recordId: product.id,
    newValue: product,
  });

  if (data.quantity && data.quantity > 0) {
    await createStockMovement({
      itemType: "PRODUCT",
      itemId: product.id,
      type: "IN",
      quantity: data.quantity,
      reason: "Initial stock",
      userId,
    });
  }

  await checkLowStockNotifications();
  return getProduct(product.id);
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    recipe: RecipeItem[];
    minStockAlert: number;
    expiryDays: number;
  }>,
  userId: string
) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Product not found");

  if (data.recipe) await validateRecipe(data.recipe);

  const updateData: Prisma.ProductUpdateInput = {
    name: data.name,
    minStockAlert: data.minStockAlert,
    expiryDays: data.expiryDays,
  };
  if (data.recipe) {
    (updateData as Prisma.ProductUpdateInput & { recipe?: Prisma.InputJsonValue }).recipe = data.recipe as unknown as Prisma.InputJsonValue;
  }

  const product = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  await createAuditLog({
    userId,
    action: "UPDATE",
    tableName: "Product",
    recordId: id,
    oldValue: existing,
    newValue: product,
  });

  await checkLowStockNotifications();
  return getProduct(id);
}

export async function deleteProduct(id: string, userId: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Product not found");

  await prisma.product.delete({ where: { id } });

  await createAuditLog({
    userId,
    action: "DELETE",
    tableName: "Product",
    recordId: id,
    oldValue: existing,
  });
}

export async function calculateProductionRequirements(
  productId: string,
  quantityProduced: number
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, "Product not found");

  const recipe = parseRecipe((product as unknown as { recipe?: unknown }).recipe);
  const materialIds = recipe.map((r) => r.rawMaterialId);
  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: materialIds } },
  });
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  let totalCost = 0;
  const requirements = recipe.map((item) => {
    const material = materialMap.get(item.rawMaterialId);
    if (!material) throw new AppError(400, "Recipe material not found");

    const requiredQty = item.quantityPerUnit * quantityProduced;
    const available = decimalToNumber(material.quantity);
    const cost = requiredQty * decimalToNumber(material.costPerUnit);
    totalCost += cost;

    return {
      rawMaterialId: item.rawMaterialId,
      rawMaterialName: material.name,
      unit: material.unit,
      quantityRequired: requiredQty,
      quantityAvailable: available,
      sufficient: available >= requiredQty,
      cost,
    };
  });

  const allSufficient = requirements.every((r) => r.sufficient);
  const costPerUnit = quantityProduced > 0 ? totalCost / quantityProduced : 0;

  return {
    productId,
    productName: product.name,
    quantityProduced,
    requirements,
    totalCost,
    costPerUnit,
    allSufficient,
  };
}

export async function adjustProductStock(
  id: string,
  quantity: number,
  reason: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id } });
    if (!product) throw new AppError(404, "Product not found");

    const newQty = decimalToNumber(product.quantity) + quantity;
    if (newQty < 0) throw new AppError(400, "Insufficient stock");

    const updated = await tx.product.update({
      where: { id },
      data: { quantity: newQty },
    });

    await tx.stockMovement.create({
      data: {
        itemType: "PRODUCT",
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
      tableName: "Product",
      recordId: id,
      oldValue: { quantity: product.quantity },
      newValue: { quantity: updated.quantity },
    });

    return {
      ...updated,
      quantity: decimalToNumber(updated.quantity),
      minStockAlert: decimalToNumber(updated.minStockAlert),
    };
  });
}
