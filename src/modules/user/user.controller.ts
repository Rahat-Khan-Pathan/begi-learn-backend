import { checkJWT, checkVerifyJWT } from "./../../utils/checkJWT";
import { RequestHandler } from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { defaultErrorHandler } from "./../../utils/error";
import { createJwtUserToken } from "../../utils/createJWT";
import { IUser } from "../../types/user";
import { sendEmail } from "../../utils/email";
import { configs } from "../../configs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const SignUpUser: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            username: Joi.string()
                .pattern(/^\S*$/, { name: "no spaces" })
                .required()
                .messages({
                    "string.base": "Username should be a type of text",
                    "string.empty": "Username cannot be an empty field",
                    "string.pattern.name": "Username cannot contain spaces",
                    "any.required": "Username is a required field",
                }),
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    "string.email": "Please provide a valid email address",
                    "any.required": "Email is a required field",
                }),
            fullName: Joi.string().required(),
            password: Joi.string().min(6).required().messages({
                "string.base": "Password should be a type of text",
                "string.empty": "Password cannot be an empty field",
                "string.min":
                    "Password should have a minimum length of {#limit} characters",
                "any.required": "Password is a required field",
            }),
        });
        const reqData = schema.validate(req.body);
        if (reqData.error) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: reqData.error.details[0].message,
            });
        }
        const { username, fullName, email, password } = req.body;

        const userData = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (userData) {
            return defaultErrorHandler({
                res,
                status: 401,
                message:
                    "User already registered with this email. Please login!",
            });
        }
        const userData2 = await prisma.user.findUnique({
            where: {
                username,
            },
        });
        if (userData2) {
            return defaultErrorHandler({
                res,
                status: 401,
                message:
                    "This username is not available. Please try another username!",
            });
        }
        const salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(password, salt);
        const user = await prisma.user.create({
            data: {
                username,
                email,
                fullName,
                password: hashPass,
            },
        });
        user.password = "";
        const token = createJwtUserToken(user);
        const msg = `Hi, please verify your account by clicking this link - ${configs.CLIENT_URL}verify?user_t=${token}`;
        sendEmail({ to: email, message: msg, subject: "Verify your account" });

        await prisma.activityLog.create({
            data: {
                type: "success",
                details: `New user created! email -> ${email}`,
            },
        });
        res.status(200).json({
            success: true,
            message:
                "User registered successfully! An email was sent to your mail, please verify your account.",
            token,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const VerifyUser: RequestHandler = async (req, res) => {
    try {
        const { user_t } = req.query as { user_t: string };
        const userDecoded = checkVerifyJWT(user_t);
        if (!userDecoded) {
            return defaultErrorHandler({
                res,
                status: 401,
                message: "Invalid link! Please check your email again.",
            });
        }

        const userData = await prisma.user.findFirst({
            where: {
                email: userDecoded?.email,
                isVerified: false,
            },
        });
        if (!userData) {
            return res.status(200).json({
                success: false,
                message: "This user is already verified. Please login!",
            });
        }
        const user = await prisma.user.update({
            where: {
                id: userDecoded?.id,
            },
            data: {
                isVerified: true,
            },
        });

        await prisma.activityLog.create({
            data: {
                type: "success",
                details: `User verified! email -> ${userDecoded?.email}`,
            },
        });
        res.status(200).json({
            success: true,
            message: "User verified successfully. Pleas login!",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: "Invalid link! Please check your email again." });
    }
};

export const LogInUser: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    "string.email": "Please provide a valid email address",
                    "any.required": "Email is a required field",
                }),
            password: Joi.string().required().messages({
                "string.base": "Password should be a type of text",
                "string.empty": "Password cannot be an empty field",
                "any.required": "Password is a required field",
            }),
        });
        const reqData = schema.validate(req.body);
        if (reqData.error) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: reqData.error.details[0].message,
            });
        }
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return defaultErrorHandler({
                res,
                status: 401,
                message: "This email is not registered yet!",
            });
        }
        const user2 = await prisma.user.findFirst({
            where: {
                email,
                isVerified: true,
            },
        });
        if (!user2) {
            return defaultErrorHandler({
                res,
                status: 401,
                message:
                    "This email is not verified yet! An email was sent for verification.",
            });
        }
        const matched = bcrypt.compareSync(password, user.password as string);

        if (!matched) {
            return res.status(401).json({
                message: "Wrong password!",
                success: false,
            });
        }
        user.password = "";
        const jwtToken = createJwtUserToken(user);
        res.json({
            data: {
                token: jwtToken,
                user: user,
            },
            success: true,
            message: "Login successfull"
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const ForgotPasswordLink: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    "string.email": "Please provide a valid email address",
                    "any.required": "Email is a required field",
                }),
        });
        const reqData = schema.validate(req.body);
        if (reqData.error) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: reqData.error.details[0].message,
            });
        }
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return defaultErrorHandler({
                res,
                status: 401,
                message:
                    "This email is not registered yet!",
            });
        }
        if (!user.isVerified) {
            return defaultErrorHandler({
                res,
                status: 401,
                message:
                    "This email is not verified yet. You can't change password now!",
            });
        }
        user.password="";
        const token = createJwtUserToken(user);
        const msg = `Hi, to change your password click this link - ${configs.CLIENT_URL}forgot-password?user_t=${token}`;
        sendEmail({ to: email, message: msg, subject: "Change Password" });
        
        res.status(200).json({
            success: true,
            message:
                "An email was sent to your mail to change your password.",
            token,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const ChangePassword: RequestHandler = async (req, res) => {
    try {
        const { user_t } = req.query as { user_t: string };
        const schema = Joi.object({
            password: Joi.string().min(6).required().messages({
                "string.base": "Password should be a type of text",
                "string.empty": "Password cannot be an empty field",
                "string.min":
                    "Password should have a minimum length of {#limit} characters",
                "any.required": "Password is a required field",
            }),
        });
        const reqData = schema.validate(req.body);
        if (reqData.error) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: reqData.error.details[0].message,
            });
        }
        const { password } = req.body;
        const userDecoded = checkVerifyJWT(user_t);
        if (!userDecoded) {
            return defaultErrorHandler({
                res,
                status: 401,
                message: "Invalid link! Please check your email again.",
            });
        }

        const userData = await prisma.user.findFirst({
            where: {
                email: userDecoded?.email,
                isVerified: true,
            },
        });
        if (!userData) {
            return res.status(200).json({
                success: false,
                message: "Invalid link! Please check your email again.",
            });
        }
        const salt = bcrypt.genSaltSync(10);
        const hashPass = bcrypt.hashSync(password, salt);
        const user = await prisma.user.update({
            where: {
                id: userDecoded?.id,
            },
            data: {
                password: hashPass,
            },
        });

        res.status(200).json({
            success: true,
            message: "Password Changed successfully. Pleas login!",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: "Invalid link! Please check your email again." });
    }
};

export const getSummary: RequestHandler = async (req, res) => {
    try {
        const totalProblems = await prisma.problem.count({});
        const verifiedProblems = await prisma.problem.count({
            where: {
                isVerified : true
            }
        });
        const myProblems = await prisma.problem.count({
            where: {
                creatorId: req.auth?.id,
            },
        });
        const totalSubmissions = await prisma.submission.count({});
        const mySubmissions = await prisma.submission.count({
            where: {
                userId: req.auth?.id,
            },
        });
        const acceptedSubmissions = await prisma.submission.count({
            where: {
                userId: req.auth?.id,
                result: "Accepted",
            },
        });
        return res.status(200).json({
            success: true,
            data: {
                totalProblems,
                myProblems,
                totalSubmissions,
                mySubmissions,
                acceptedSubmissions,
                verifiedProblems
            },
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getLeaderBoard: RequestHandler = async (req, res) => {
    try {
        const {search} = req.query as {search:string};
        let { page, limit } = req.query as Record<string, string>;
        if (!page) page = "1";
        if (!limit) limit = "10";
        const limited = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * limited;
        let searchParams: {
            username?: object;
        } = {};
        if (search) {
            searchParams["username"] = {
                contains: search.trim(),
                mode: "insensitive",
            };
        }
        const totalCount = await prisma.user.count({
            where: searchParams,
        });
        const allUsers = await prisma.user.findMany({
            where: searchParams,
            select: {
                id: true,
                username: true,
                submission: true
            },
            skip: skip,
            take: limited
        });
        return res.status(200).json({
            success: true,
            data: allUsers,
            total: totalCount,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getAllUsers: RequestHandler = async (req, res) => {
    try {
        const {search} = req.query as {search:string};
        let { page, limit } = req.query as Record<string, string>;
        if (!page) page = "1";
        if (!limit) limit = "10";
        const limited = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * limited;
        let searchParams: {
            username?: object;
        } = {};
        if (search) {
            searchParams["username"] = {
                contains: search.trim(),
                mode: "insensitive",
            };
        }
        const totalCount = await prisma.user.count({
            where: searchParams,
        });
        const allUsers = await prisma.user.findMany({
            where: searchParams,
            skip: skip,
            take: limited
        });
        return res.status(200).json({
            success: true,
            data: allUsers,
            total: totalCount
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const updateActive: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().required().messages({
                "number.base": "User Id should be a type of number",
                "any.required": "User Id is a required field",
                "any.empty": "User Id cannot be an empty field",
            }),
            value: Joi.boolean().required().messages({
                "boolean.base": "Value should be a type of boolean",
                "any.required": "Value is a required field",
                "any.empty": "Value cannot be an empty field",
            }),
        });
        const reqData = schema.validate(req.body);
        if (reqData.error) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: reqData.error.details[0].message,
            });
        }
        const { userId, value } = req.body;
        const userData = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!userData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "No User Found!",
            });
        }
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                isActive: value,
            },
        });
        return res.status(200).json({
            success: true,
            message: value ? "User Activated Successfully" : "User Deactivated Successfully",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};