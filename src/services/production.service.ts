import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";
import {
    checkLowStockNotifications,
    createAuditLog,
    decimalToNumber,
    parseRecipe,
} from "./helpers";
import { calculateProductionRequirements } from "./product.service";

export async function createProductionBatch(
  data: { productId: string; quantityProduced: number },
  userId: string
) {
  const preview = await calculateProductionRequirements(
    data.productId,
    data.quantityProduced
  );

  if (!preview.allSufficient) {
    throw new AppError(
      400,
      "Insufficient raw materials: " +
        preview.requirements
          .filter((r) => !r.sufficient)
          .map((r) => r.rawMaterialName)
          .join(", ")
    );
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) throw new AppError(404, "Product not found");

    const recipe = parseRecipe(product.recipe);
    let totalCost = 0;
    const materialEntries: Array<{
      rawMaterialId: string;
      quantityUsed: number;
      costAtTime: number;
    }> = [];

    for (const item of recipe) {
      const requiredQty = item.quantityPerUnit * data.quantityProduced;
      const material = await tx.rawMaterial.findUnique({
        where: { id: item.rawMaterialId },
      });
      if (!material) throw new AppError(400, "Recipe material not found");

      const available = decimalToNumber(material.quantity);
      if (available < requiredQty) {
        throw new AppError(400, `Insufficient ${material.name}`);
      }

      const costAtTime = decimalToNumber(material.costPerUnit);
      totalCost += requiredQty * costAtTime;

      await tx.rawMaterial.update({
        where: { id: item.rawMaterialId },
        data: { quantity: available - requiredQty },
      });

      await tx.stockMovement.create({
        data: {
          itemType: "RAW_MATERIAL",
          itemId: item.rawMaterialId,
          type: "OUT",
          quantity: requiredQty,
          reason: `Production batch for ${product.name}`,
          userId,
        },
      });

      materialEntries.push({
        rawMaterialId: item.rawMaterialId,
        quantityUsed: requiredQty,
        costAtTime,
      });
    }

    const updatedProduct = await tx.product.update({
      where: { id: data.productId },
      data: {
        quantity: decimalToNumber(product.quantity) + data.quantityProduced,
      },
    });

    const batch = await tx.productionBatch.create({
      data: {
        productId: data.productId,
        quantityProduced: data.quantityProduced,
        totalCost,
        costPerUnit: data.quantityProduced > 0 ? totalCost / data.quantityProduced : 0,
        userId,
        materials: {
          create: materialEntries.map((item) => ({
            rawMaterialId: item.rawMaterialId,
            quantityUsed: item.quantityUsed,
            costAtTime: item.costAtTime,
          })),
        },
      },
      include: {
        product: true,
        user: { select: { id: true, name: true } },
        materials: { include: { rawMaterial: true } },
      },
    });

    await tx.stockMovement.create({
      data: {
        itemType: "PRODUCT",
        itemId: data.productId,
        type: "IN",
        quantity: data.quantityProduced,
        reason: "Production batch",
        userId,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      tableName: "ProductionBatch",
      recordId: batch.id,
      newValue: batch,
    });

    await checkLowStockNotifications();

    return {
      ...batch,
      quantityProduced: decimalToNumber(batch.quantityProduced),
      totalCost: decimalToNumber(batch.totalCost),
      costPerUnit: decimalToNumber(batch.costPerUnit),
      product: {
        ...batch.product,
        quantity: decimalToNumber(updatedProduct.quantity),
      },
    };
  });
}

export async function listProductionBatches(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [batches, total] = await Promise.all([
    prisma.productionBatch.findMany({
      skip,
      take: limit,
      orderBy: { producedAt: "desc" },
      include: {
        product: true,
        user: { select: { id: true, name: true } },
        materials: { include: { rawMaterial: true } },
      },
    }),
    prisma.productionBatch.count(),
  ]);

  return {
    data: batches.map((b) => ({
      ...b,
      quantityProduced: decimalToNumber(b.quantityProduced),
      totalCost: decimalToNumber(b.totalCost),
      costPerUnit: decimalToNumber(b.costPerUnit),
      product: {
        ...b.product,
        quantity: decimalToNumber(b.product.quantity),
      },
    })),
    total,
    page,
    limit,
  };
}

export async function getProductionPreview(
  productId: string,
  quantityProduced: number
) {
  return calculateProductionRequirements(productId, quantityProduced);
}
