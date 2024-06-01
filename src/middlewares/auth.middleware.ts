import { RequestHandler } from "express";
import { defaultErrorHandler } from "../utils/error";
import { checkJWT } from "../utils/checkJWT";

export const authCheck: RequestHandler = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return defaultErrorHandler({
                res,
                status: 401,
                message: "No Login Token Found! Please Log In Again",
            });
        }
        const auth = checkJWT(token);
        if (auth) {
            req.auth = auth;
            return next();
        }
        return defaultErrorHandler({
            res,
            status: 401,
            message: "Invalid Login Token Found! Please Log In Again",
        });
    } catch (error: any) {
        return res.status(401).json({ message: error?.message });
    }
};
export const verifyAdmin: RequestHandler = (req, res, next) => {
    const role = req.auth?.role;
    if (role === "MEMBER") {
        return res.status(401).json({ message: "Only admin has access to this task!" });
    }
    return next();
};