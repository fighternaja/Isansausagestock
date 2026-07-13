import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const rawMaterialSchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.string().min(1).max(50),
  quantity: z.coerce.number().min(0).optional(),
  minStockAlert: z.coerce.number().min(0),
  costPerUnit: z.coerce.number().min(0),
});

export const productRecipeItemSchema = z.object({
  rawMaterialId: z.string().cuid(),
  quantityPerUnit: z.coerce.number().positive(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  recipe: z.array(productRecipeItemSchema).min(1),
  quantity: z.coerce.number().min(0).optional(),
  minStockAlert: z.coerce.number().min(0),
  expiryDays: z.coerce.number().int().min(1),
});

export const productionSchema = z.object({
  productId: z.string().cuid(),
  quantityProduced: z.coerce.number().positive(),
});

export const salesOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.coerce.number().positive(),
      })
    )
    .min(1),
});

export const stockAdjustSchema = z.object({
  itemType: z.enum(["RAW_MATERIAL", "PRODUCT"]),
  itemId: z.string().cuid(),
  quantity: z.coerce.number(),
  reason: z.string().min(1).max(500),
});

export const idParamSchema = z.object({
  id: z.string().cuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dashboardQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});
