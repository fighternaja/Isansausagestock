import { Prisma } from "@prisma/client";
import { RecipeItem } from "./helpers";
export declare function listProducts(): Promise<{
    recipe: {
        rawMaterialName: string;
        unit: string;
        rawMaterialId: string;
        quantityPerUnit: number;
    }[];
    quantity: number;
    minStockAlert: number;
    isLowStock: boolean;
    id: string;
    name: string;
    createdAt: Date;
    expiryDays: number;
    updatedAt: Date;
}[]>;
export declare function getProduct(id: string): Promise<{
    recipe: {
        rawMaterialName: string;
        unit: string;
        rawMaterialId: string;
        quantityPerUnit: number;
    }[];
    quantity: number;
    minStockAlert: number;
    id: string;
    name: string;
    createdAt: Date;
    expiryDays: number;
    updatedAt: Date;
}>;
export declare function createProduct(data: {
    name: string;
    recipe: RecipeItem[];
    quantity?: number;
    minStockAlert: number;
    expiryDays: number;
}, userId: string): Promise<{
    recipe: {
        rawMaterialName: string;
        unit: string;
        rawMaterialId: string;
        quantityPerUnit: number;
    }[];
    quantity: number;
    minStockAlert: number;
    id: string;
    name: string;
    createdAt: Date;
    expiryDays: number;
    updatedAt: Date;
}>;
export declare function updateProduct(id: string, data: Partial<{
    name: string;
    recipe: RecipeItem[];
    minStockAlert: number;
    expiryDays: number;
}>, userId: string): Promise<{
    recipe: {
        rawMaterialName: string;
        unit: string;
        rawMaterialId: string;
        quantityPerUnit: number;
    }[];
    quantity: number;
    minStockAlert: number;
    id: string;
    name: string;
    createdAt: Date;
    expiryDays: number;
    updatedAt: Date;
}>;
export declare function deleteProduct(id: string, userId: string): Promise<void>;
export declare function calculateProductionRequirements(productId: string, quantityProduced: number): Promise<{
    productId: string;
    productName: string;
    quantityProduced: number;
    requirements: {
        rawMaterialId: string;
        rawMaterialName: string;
        unit: string;
        quantityRequired: number;
        quantityAvailable: number;
        sufficient: boolean;
        cost: number;
    }[];
    totalCost: number;
    costPerUnit: number;
    allSufficient: boolean;
}>;
export declare function adjustProductStock(id: string, quantity: number, reason: string, userId: string): Promise<{
    quantity: number;
    minStockAlert: number;
    id: string;
    name: string;
    createdAt: Date;
    recipe: Prisma.JsonValue | null;
    expiryDays: number;
    updatedAt: Date;
}>;
//# sourceMappingURL=product.service.d.ts.map