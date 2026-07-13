import { Prisma } from "@prisma/client";
export interface RecipeItem {
    rawMaterialId: string;
    quantityPerUnit: number;
}
export declare function parseRecipe(recipe: unknown): RecipeItem[];
export declare function createAuditLog(params: {
    userId: string;
    action: string;
    tableName: string;
    recordId: string;
    oldValue?: unknown;
    newValue?: unknown;
}): Promise<void>;
export declare function createStockMovement(params: {
    itemType: "RAW_MATERIAL" | "PRODUCT";
    itemId: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    reason?: string;
    userId: string;
}): Promise<void>;
export declare function notifyAdmins(title: string, message: string, type: string): Promise<void>;
export declare function checkLowStockNotifications(): Promise<void>;
export declare function decimalToNumber(value: Prisma.Decimal | number): number;
//# sourceMappingURL=helpers.d.ts.map