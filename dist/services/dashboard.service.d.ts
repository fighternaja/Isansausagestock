export declare function getDashboardStats(days?: number): Promise<{
    summary: {
        totalRevenue: number;
        totalProductionCost: number;
        profit: number;
        orderCount: number;
        batchCount: number;
        lowStockCount: number;
    };
    dailySales: never[];
    monthlySales: never[];
    stockOverview: {
        rawMaterials: {
            id: string;
            name: string;
            quantity: number;
            unit: string;
            minStockAlert: number;
            isLowStock: boolean;
        }[];
        products: {
            id: string;
            name: string;
            quantity: number;
            minStockAlert: number;
            isLowStock: boolean;
        }[];
    };
    topSellingProducts: never[];
    lowStockAlerts: ({
        type: "RAW_MATERIAL";
        name: string;
        quantity: number;
        unit: string;
    } | {
        type: "PRODUCT";
        name: string;
        quantity: number;
        unit: string;
    })[];
}>;
export declare function listAuditLogs(page?: number, limit?: number): Promise<{
    data: ({
        user: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        tableName: string;
        recordId: string;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
    })[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function listNotifications(userId: string, unreadOnly?: boolean): Promise<{
    message: string;
    type: string;
    id: string;
    createdAt: Date;
    userId: string;
    title: string;
    read: boolean;
}[]>;
export declare function markNotificationRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare function markAllNotificationsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
export declare function getUnreadNotificationCount(userId: string): Promise<number>;
//# sourceMappingURL=dashboard.service.d.ts.map