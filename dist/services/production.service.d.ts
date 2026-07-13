export declare function createProductionBatch(data: {
    productId: string;
    quantityProduced: number;
}, userId: string): Promise<{
    quantityProduced: number;
    totalCost: number;
    costPerUnit: number;
    product: {
        quantity: number;
        id: string;
        name: string;
        createdAt: Date;
        minStockAlert: import("@prisma/client/runtime/library").Decimal;
        recipe: import("@prisma/client/runtime/library").JsonValue | null;
        expiryDays: number;
        updatedAt: Date;
    };
    user: {
        id: string;
        name: string;
    };
    materials: ({
        rawMaterial: {
            id: string;
            name: string;
            createdAt: Date;
            unit: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            minStockAlert: import("@prisma/client/runtime/library").Decimal;
            costPerUnit: import("@prisma/client/runtime/library").Decimal;
            updatedAt: Date;
        };
    } & {
        rawMaterialId: string;
        quantityUsed: import("@prisma/client/runtime/library").Decimal;
        costAtTime: import("@prisma/client/runtime/library").Decimal;
        batchId: string;
    })[];
    id: string;
    userId: string;
    productId: string;
    producedAt: Date;
}>;
export declare function listProductionBatches(page?: number, limit?: number): Promise<{
    data: {
        quantityProduced: number;
        totalCost: number;
        costPerUnit: number;
        product: {
            quantity: number;
            id: string;
            name: string;
            createdAt: Date;
            minStockAlert: import("@prisma/client/runtime/library").Decimal;
            recipe: import("@prisma/client/runtime/library").JsonValue | null;
            expiryDays: number;
            updatedAt: Date;
        };
        user: {
            id: string;
            name: string;
        };
        materials: ({
            rawMaterial: {
                id: string;
                name: string;
                createdAt: Date;
                unit: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                minStockAlert: import("@prisma/client/runtime/library").Decimal;
                costPerUnit: import("@prisma/client/runtime/library").Decimal;
                updatedAt: Date;
            };
        } & {
            rawMaterialId: string;
            quantityUsed: import("@prisma/client/runtime/library").Decimal;
            costAtTime: import("@prisma/client/runtime/library").Decimal;
            batchId: string;
        })[];
        id: string;
        userId: string;
        productId: string;
        producedAt: Date;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function getProductionPreview(productId: string, quantityProduced: number): Promise<{
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
//# sourceMappingURL=production.service.d.ts.map