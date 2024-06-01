export interface IUser {
    id?: number;
    username: string;
    fullName?: string;
    email: string;
    password?: string;
    phone?: string;
    profileImage?: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    role: "MEMBER" | "ADMIN";
}