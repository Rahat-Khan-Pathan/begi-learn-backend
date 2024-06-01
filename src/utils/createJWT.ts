import { configs } from './../configs';
import { IUser } from "../types/user";
import { sign } from "jsonwebtoken";

export const createJwtUserToken = (payload: IUser) => {
    const { JWT_SECRET } = configs;
    return sign(payload, JWT_SECRET);
};