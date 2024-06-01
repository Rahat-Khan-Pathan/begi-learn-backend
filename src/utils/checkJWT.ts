import { verify } from "jsonwebtoken";
import { configs } from "../configs";
import { IUser } from "../types/user";

export const checkJWT = (token?: string) => {
    if (token && token.startsWith("Bearer ") && token.split(" ")[1]) {        
        return verify(token.split(" ")[1], configs.JWT_SECRET) as IUser;
    }
    return null;
};
export const checkVerifyJWT = (token?: string) => {
    if (token) {        
        return verify(token, configs.JWT_SECRET) as IUser;
    }
    return null;
};