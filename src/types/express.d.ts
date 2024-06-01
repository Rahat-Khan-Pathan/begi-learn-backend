import { IUser } from "./user";

declare global {
    namespace Express {
        interface Request {
            auth?: IUser;
            value?: Partial<
                Record<"body" | "query" | "params", Record<string, unknown>>
            >;
        }
    }
}