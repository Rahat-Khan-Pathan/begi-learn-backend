import { RequestHandler } from "express";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";
import { defaultErrorHandler } from "./../../utils/error";

import { configs } from "../../configs";

const prisma = new PrismaClient();

export const addProblem: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required().messages({
                "string.base": "Title should be a type of text",
                "string.empty": "Title cannot be an empty field",
                "any.required": "Title is a required field",
            }),
            difficulty: Joi.string()
                .valid("Easy", "Medium", "Hard")
                .required()
                .messages({
                    "any.only":
                        "Difficulty must be one of [Easy, Medium, Hard]",
                    "string.empty":
                        "Difficulty is required and cannot be empty",
                }),
            statement: Joi.string().required().messages({
                "string.base": "Statement should be a type of text",
                "string.empty": "Statement cannot be an empty field",
                "any.required": "Statement is a required field",
            }),
            inputFormat: Joi.string().required().messages({
                "string.base": "Input Format should be a type of text",
                "string.empty": "Input Format cannot be an empty field",
                "any.required": "Input Format is a required field",
            }),
            outputFormat: Joi.string().required().messages({
                "string.base": "Output Format should be a type of text",
                "string.empty": "Output Format cannot be an empty field",
                "any.required": "Output Format is a required field",
            }),
            constraints: Joi.string().required().messages({
                "string.base": "Constraints should be a type of text",
                "string.empty": "Constraints cannot be an empty field",
                "any.required": "Constraints is a required field",
            }),
            tags: Joi.array()
                .items(
                    Joi.number().strict().messages({
                        "number.base": "Tag Id must be a number",
                        "any.required":
                            "Tag Id are required and cannot be empty",
                    })
                )
                .required()
                .messages({
                    "array.base": "Tags must be an array",
                    "any.required": "Tags are required and cannot be empty",
                }),
            creatorId: Joi.number().required().strict().messages({
                "number.base": "Creator Id must be a number",
                "any.required": "Creator Id are required and cannot be empty",
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
        const {
            title,
            difficulty,
            statement,
            inputFormat,
            outputFormat,
            constraints,
            tags,
            creatorId,
        } = req.body;
        const newProblem = await prisma.problem.create({
            data: {
                title,
                difficulty,
                statement,
                inputFormat,
                outputFormat,
                constraints,
                tags: {
                    connect: tags.map((id: number) => ({ id })),
                },
                creatorId: creatorId,
            },
        });
        return res.status(200).json({
            success: true,
            message: "New problem created!",
            problemId: newProblem.id,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const updateProblem: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const problemData = await prisma.problem.findFirst({
            where:
                req.auth?.role === "ADMIN"
                    ? {
                          id: parseInt(id),
                      }
                    : {
                          id: parseInt(id),
                          creatorId: req.auth?.id,
                      },
            include: {
                tags: true,
            },
        });
        if (!problemData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "No Problem Found!",
            });
        }
        const schema = Joi.object({
            title: Joi.string().messages({
                "string.base": "Title should be a type of text",
                "string.empty": "Title cannot be an empty field",
            }),
            difficulty: Joi.string().valid("Easy", "Medium", "Hard").messages({
                "any.only": "Difficulty must be one of [Easy, Medium, Hard]",
                "string.empty": "Difficulty is required and cannot be empty",
            }),
            statement: Joi.string().messages({
                "string.base": "Statement should be a type of text",
                "string.empty": "Statement cannot be an empty field",
            }),
            inputFormat: Joi.string().messages({
                "string.base": "Input Format should be a type of text",
                "string.empty": "Input Format cannot be an empty field",
            }),
            outputFormat: Joi.string().messages({
                "string.base": "Output Format should be a type of text",
                "string.empty": "Output Format cannot be an empty field",
            }),
            constraints: Joi.string().messages({
                "string.base": "Constraints should be a type of text",
                "string.empty": "Constraints cannot be an empty field",
            }),
            tags: Joi.array()
                .items(
                    Joi.number().strict().messages({
                        "number.base": "Tag Id must be a number",
                        "any.required":
                            "Tag Id are required and cannot be empty",
                    })
                )
                .messages({
                    "array.base": "Tags must be an array",
                    "any.required": "Tags are required and cannot be empty",
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
        const {
            title,
            difficulty,
            statement,
            inputFormat,
            outputFormat,
            constraints,
            tags,
        } = req.body;
        const existingTagIds = problemData.tags.map((tag) => tag.id);
        const tagsToConnect = tags.filter(
            (id: number) => !existingTagIds.includes(id)
        );
        const tagsToDisconnect = existingTagIds.filter(
            (id: number) => !tags.includes(id)
        );
        const newProblem = await prisma.problem.update({
            where: {
                id: parseInt(id),
            },
            data: {
                title,
                difficulty,
                statement,
                inputFormat,
                outputFormat,
                constraints,
                tags: {
                    connect: tagsToConnect.map((id: number) => ({ id })),
                    disconnect: tagsToDisconnect.map((id: number) => ({ id })),
                },
            },
        });
        return res.status(200).json({
            success: true,
            message: "Problem Details Updated!",
            problemId: newProblem.id,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const getAllProblems: RequestHandler = async (req, res) => {
    try {
        const { verified, search, tagId } = req.query as {
            verified: string;
            search: string;
            tagId: string;
        };
        let { page, limit } = req.query as Record<string, string>;
        if (!page) page = "1";
        if (!limit) limit = "10";
        const limited = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * limited;
        let searchParams: {
            isVerified?: boolean;
            creatorId?: number;
            title?: object;
            tags?: object;
        } = {};
        if (parseInt(verified) === 1) {
            searchParams["isVerified"] = true;
        } else if (req.auth?.role === "MEMBER") {
            searchParams["creatorId"] = req.auth?.id;
        }
        if (search) {
            searchParams["title"] = {
                contains: search.trim(),
                mode: "insensitive",
            };
        }
        if (tagId && tagId !== "null") {
            searchParams["tags"] = {
                some: {
                    id: parseInt(tagId),
                },
            };
        }
        const totalCount = await prisma.problem.count({
            where: searchParams,
        });
        const allProblems = await prisma.problem.findMany({
            where: searchParams,
            select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
                isVerified: true,
                isActive: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                submission: true
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: skip,
            take: limited,
            
        });
        return res.status(200).json({
            success: true,
            data: allProblems,
            total: totalCount,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const updateVerification: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            problemId: Joi.number().required().messages({
                "number.base": "Problem Id should be a type of number",
                "any.required": "Problem Id is a required field",
                "any.empty": "Problem Id cannot be an empty field",
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
        const { problemId, value } = req.body;
        const problemData = await prisma.problem.findUnique({
            where: { id: problemId },
        });
        if (!problemData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "No Problem Found!",
            });
        }
        await prisma.problem.update({
            where: {
                id: problemId,
            },
            data: {
                isVerified: value,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Problem Verification Updated",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getProblemById: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const problem = await prisma.problem.findFirst({
            where:
                req.auth?.role === "ADMIN"
                    ? {
                          id: parseInt(id),
                      }
                    : {
                          id: parseInt(id),
                          creatorId: req.auth?.id,
                      },
            select: {
                id: true,
                title: true,
                difficulty: true,
                statement: true,
                inputFormat: true,
                outputFormat: true,
                constraints: true,
                tags: true,
                testCases: {
                    where: {
                        sample: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });
        return res.status(200).json({
            success: true,
            data: problem,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const deleteProblem: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const problemData = await prisma.problem.findUnique({
            where: { id: parseInt(id) },
        });
        if (!problemData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "No Problem Found!",
            });
        }
        await prisma.problem.delete({
            where: {
                id: parseInt(id),
            },
        });
        return res.status(200).json({
            success: true,
            message: "Problem Deleted",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
