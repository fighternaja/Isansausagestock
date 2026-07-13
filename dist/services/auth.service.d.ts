import { UserRole } from "@prisma/client";
export declare function registerUser(data: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}): Promise<{
    id: string;
    email: string;
    name: string;
    role: import(".prisma/client").$Enums.UserRole;
    createdAt: Date;
}>;
export declare function loginUser(email: string, password: string): Promise<{
    user: {
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
}>;
export declare function logoutUser(refreshToken: string): Promise<void>;
export declare function getUserById(id: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: import(".prisma/client").$Enums.UserRole;
    createdAt: Date;
}>;
export declare function listUsers(): Promise<{
    id: string;
    email: string;
    name: string;
    role: import(".prisma/client").$Enums.UserRole;
    createdAt: Date;
}[]>;
//# sourceMappingURL=auth.service.d.ts.map