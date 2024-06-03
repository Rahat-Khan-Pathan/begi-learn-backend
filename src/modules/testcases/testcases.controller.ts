import { RequestHandler } from "express";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";
import { defaultErrorHandler } from "./../../utils/error";

import { configs } from "../../configs";

const prisma = new PrismaClient();

export const addTestCase: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            input: Joi.string().required().messages({
                "string.base": "Input should be a type of text",
                "string.empty": "Input cannot be an empty field",
                "any.required": "Input is a required field",
            }),
            output: Joi.string().required().messages({
                "string.base": "Output should be a type of text",
                "string.empty": "Output cannot be an empty field",
                "any.required": "Output is a required field",
            }),
            problemId: Joi.number().required().strict().messages({
                "number.base": "Problem Id must be a number",
                "any.required": "Problem Id are required and cannot be empty",
            }),
            sample: Joi.boolean().messages({
                "boolean.base": "Sample must be of type boolean",
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
        const {problemId} = req.body;
        const problemData = await prisma.problem.findUnique({where: {
            id: problemId
        }})
        if(!problemData) {
            return defaultErrorHandler({res, status: 404, message: "No Problem Found"});
        }
        if(req.auth?.role !== "ADMIN" && problemData.creatorId !== req.auth?.id) {
            return defaultErrorHandler({res, status: 404, message: "You are not allowed to add test case in this problem."});
        }
        const newTestCase = await prisma.testCase.create({
            data: req.body,
        });
        return res.status(200).json({
            success: true,
            message: "New Test Case Added!",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const updateTestCase: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const testCaseData = await prisma.testCase.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        if (!testCaseData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "No Test Case Found!",
            });
        }
        const problemData = await prisma.problem.findUnique({where: {
            id: testCaseData.problemId
        }})
        if(!problemData) {
            return defaultErrorHandler({res, status: 404, message: "No Problem Found"});
        }
        if(req.auth?.role !== "ADMIN" && problemData.creatorId !== req.auth?.id) {
            return defaultErrorHandler({res, status: 404, message: "You are not allowed to update test case in this problem."});
        }
        const schema = Joi.object({
            input: Joi.string().messages({
                "string.base": "Input should be a type of text",
                "string.empty": "Input cannot be an empty field",
            }),
            output: Joi.string().messages({
                "string.base": "Output should be a type of text",
                "string.empty": "Output cannot be an empty field",
            }),
            sample: Joi.boolean().messages({
                "boolean.base": "Sample must be of type boolean",
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

        const updateTestCase = await prisma.testCase.update({
            where: {
                id: parseInt(id),
            },
            data: req.body,
        });
        return res.status(200).json({
            success: true,
            message: "Test Case Updated!",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const getAllTestCases: RequestHandler = async (req, res) => {
    try {
        const allTestCases = await prisma.testCase.findMany({
            select: {
                id: true,
                input: true,
                output: true,
                sample: true,
                problemId: true,
            },
        });
        return res.status(200).json({
            success: true,
            data: allTestCases,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getTestCaseById: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const testCase = await prisma.testCase.findFirst({
            where: req.auth?.role === "ADMIN" ? {
                id: parseInt(id),
            } : {
                id: parseInt(id),
                problem: {
                    creatorId: req.auth?.id
                }
            },
            select: {
                id: true,
                input: true,
                output: true,
                problemId: true,
                sample: true,
            },
        });
        if(!testCase) {
            return defaultErrorHandler({res, status:404, message:"No Problem Found or You Can't Update This Problem!"})
        }
        return res.status(200).json({
            success: true,
            data: testCase,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getTestCaseByProblemId: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const testCase = await prisma.testCase.findMany({
            where: req.auth?.role === "ADMIN" ? {
                problemId: parseInt(id),
            } : {
                problemId: parseInt(id),
                problem: {
                    creatorId: req.auth?.id
                }
            },
            select: {
                id: true,
                input: true,
                output: true,
                problemId: true,
                sample: true,
            },
            orderBy: {
                createdAt: "asc"
            }
        });
        if(testCase.length === 0) {
            return defaultErrorHandler({res, status:404, message:"No Test Case Found or You Can't Update These Test Cases!"})
        }
        return res.status(200).json({
            success: true,
            data: testCase,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const deleteTestCase: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const testCaseData = await prisma.testCase.findUnique({
            where: { id: parseInt(id) }, include: {problem: true}
        });
        if (!testCaseData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "No Test Case Found!",
            });
        }
        if (req.auth?.role !== "ADMIN" && testCaseData.problem.creatorId !== req.auth?.id) {
            return defaultErrorHandler({
                res,
                status: 401,
                message: "You are not allowed to delete this test case",
            });
        }
        await prisma.testCase.delete({
            where: {
                id: parseInt(id),
            },
        });
        return res.status(200).json({
            success: true,
            message: "Test Case Deleted",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
