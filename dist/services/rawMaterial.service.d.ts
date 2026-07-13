export declare function listRawMaterials(): Promise<{
    quantity: number;
    minStockAlert: number;
    costPerUnit: number;
    isLowStock: boolean;
    id: string;
    name: string;
    createdAt: Date;
    unit: string;
    updatedAt: Date;
}[]>;
export declare function getRawMaterial(id: string): Promise<{
    quantity: number;
    minStockAlert: number;
    costPerUnit: number;
    id: string;
    name: string;
    createdAt: Date;
    unit: string;
    updatedAt: Date;
}>;
export declare function createRawMaterial(data: {
    name: string;
    unit: string;
    quantity?: number;
    minStockAlert: number;
    costPerUnit: number;
}, userId: string): Promise<{
    quantity: number;
    minStockAlert: number;
    costPerUnit: number;
    id: string;
    name: string;
    createdAt: Date;
    unit: string;
    updatedAt: Date;
}>;
export declare function updateRawMaterial(id: string, data: Partial<{
    name: string;
    unit: string;
    minStockAlert: number;
    costPerUnit: number;
}>, userId: string): Promise<{
    quantity: number;
    minStockAlert: number;
    costPerUnit: number;
    id: string;
    name: string;
    createdAt: Date;
    unit: string;
    updatedAt: Date;
}>;
export declare function deleteRawMaterial(id: string, userId: string): Promise<void>;
export declare function adjustRawMaterialStock(id: string, quantity: number, reason: string, userId: string): Promise<{
    quantity: number;
    minStockAlert: number;
    costPerUnit: number;
    id: string;
    name: string;
    createdAt: Date;
    unit: string;
    updatedAt: Date;
}>;
//# sourceMappingURL=rawMaterial.service.d.ts.map