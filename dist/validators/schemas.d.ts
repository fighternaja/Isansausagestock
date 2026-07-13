import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "STAFF"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
    role?: "ADMIN" | "STAFF" | undefined;
}, {
    email: string;
    name: string;
    password: string;
    role?: "ADMIN" | "STAFF" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const rawMaterialSchema: z.ZodObject<{
    name: z.ZodString;
    unit: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    minStockAlert: z.ZodNumber;
    costPerUnit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    unit: string;
    minStockAlert: number;
    costPerUnit: number;
    quantity?: number | undefined;
}, {
    name: string;
    unit: string;
    minStockAlert: number;
    costPerUnit: number;
    quantity?: number | undefined;
}>;
export declare const productRecipeItemSchema: z.ZodObject<{
    rawMaterialId: z.ZodString;
    quantityPerUnit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    rawMaterialId: string;
    quantityPerUnit: number;
}, {
    rawMaterialId: string;
    quantityPerUnit: number;
}>;
export declare const productSchema: z.ZodObject<{
    name: z.ZodString;
    recipe: z.ZodArray<z.ZodObject<{
        rawMaterialId: z.ZodString;
        quantityPerUnit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        rawMaterialId: string;
        quantityPerUnit: number;
    }, {
        rawMaterialId: string;
        quantityPerUnit: number;
    }>, "many">;
    quantity: z.ZodOptional<z.ZodNumber>;
    minStockAlert: z.ZodNumber;
    expiryDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    minStockAlert: number;
    recipe: {
        rawMaterialId: string;
        quantityPerUnit: number;
    }[];
    expiryDays: number;
    quantity?: number | undefined;
}, {
    name: string;
    minStockAlert: number;
    recipe: {
        rawMaterialId: string;
        quantityPerUnit: number;
    }[];
    expiryDays: number;
    quantity?: number | undefined;
}>;
export declare const productionSchema: z.ZodObject<{
    productId: z.ZodString;
    quantityProduced: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantityProduced: number;
}, {
    productId: string;
    quantityProduced: number;
}>;
export declare const salesOrderSchema: z.ZodObject<{
    customerName: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
        productId: string;
    }, {
        quantity: number;
        productId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    customerName: string;
    items: {
        quantity: number;
        productId: string;
    }[];
}, {
    customerName: string;
    items: {
        quantity: number;
        productId: string;
    }[];
}>;
export declare const stockAdjustSchema: z.ZodObject<{
    itemType: z.ZodEnum<["RAW_MATERIAL", "PRODUCT"]>;
    itemId: z.ZodString;
    quantity: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    itemType: "RAW_MATERIAL" | "PRODUCT";
    itemId: string;
    reason: string;
}, {
    quantity: number;
    itemType: "RAW_MATERIAL" | "PRODUCT";
    itemId: string;
    reason: string;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const dashboardQuerySchema: z.ZodObject<{
    days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    days: number;
}, {
    days?: number | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map