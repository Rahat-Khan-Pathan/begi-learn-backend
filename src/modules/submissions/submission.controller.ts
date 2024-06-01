import { RequestHandler } from "express";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";
import { defaultErrorHandler } from "./../../utils/error";
import axios from "axios";

import { configs } from "../../configs";

const prisma = new PrismaClient();

interface LanguageVersion {
    version: string;
}
export interface ResponseTestCase {
    id?: number;
    input: string;
    output: string;
    problemId?: number;
    submissionId: number;
    sample?: boolean;
    userOutput: string;
    verdict:
        | "Accepted"
        | "Wrong Answer"
        | "Runtime Error"
        | "Time Limit Exceeded"
        | "Compile Error"
        | "Memory Limit Exceed"
        | "Segmentation fault";
}

const map: Record<string, LanguageVersion> = {
    javascript: { version: "18.15.0" },
    c: { version: "10.2.0" },
    "c++": { version: "10.2.0" },
    go: { version: "1.16.2" },
    python: { version: "3.10.0" },
    java: { version: "15.0.2" },
};
const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
const removeSpecialCharacters = (str: string) =>
    str.replace(/[\n\r]/g, "").trim();
const truncateString = (str: string, maxLength: number) => {
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + "...";
    } else {
        return str;
    }
};
export const addSubmission: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            code: Joi.string().required().messages({
                "string.base": "Code should be a type of text",
                "string.empty": "Code cannot be an empty field",
                "any.required": "Code is a required field",
            }),
            language: Joi.valid(
                "c",
                "c++",
                "go",
                "python",
                "java",
                "javascript"
            ).messages({
                "any.required": "Language is required and cannot be empty",
            }),
            userId: Joi.number().required().strict().messages({
                "number.base": "User Id must be a number",
                "any.required": "User Id are required and cannot be empty",
            }),
            problemId: Joi.number().required().strict().messages({
                "number.base": "Problem Id must be a number",
                "any.required": "Problem Id are required and cannot be empty",
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
        const { code, userId, problemId, language } = req.body;
        const allTestCases = await prisma.testCase.findMany({
            where: {
                problemId: problemId,
            },
        });

        let promiseErr = "";
        const processTestCases = async () => {
            const allResults: ResponseTestCase[] = [];
            for (const [idx, tc] of allTestCases.entries()) {
                if (idx !== 0) {
                    await delay(250);
                }
                try {
                    const result = await axios.post(
                        "https://emkc.org/api/v2/piston/execute",
                        {
                            language: language,
                            version: map[language].version,
                            files: [
                                {
                                    content: code,
                                },
                            ],
                            stdin: tc.input,
                            args: [],
                            compile_timeout: 10000,
                            run_timeout: 3000,
                            compile_memory_limit: -1,
                            run_memory_limit: -1,
                        }
                    );
                    let verdict:
                        | "Accepted"
                        | "Wrong Answer"
                        | "Runtime Error"
                        | "Time Limit Exceeded"
                        | "Segmentation fault"
                        | "Compile Error"
                        | "Memory Limit Exceed" = "Wrong Answer";
                    let userOutput = result.data?.run?.stdout;
                    if ((result.data?.compile?.stderr as string)?.length > 0) {
                        verdict = "Compile Error";
                        userOutput = result.data?.compile?.stderr;
                    } else if (
                        (result.data?.run?.stderr as string)?.length > 0
                    ) {
                        verdict = "Runtime Error";
                        userOutput = result.data?.run?.stderr;
                    } else if (result.data?.run?.signal === "SIGKILL") {
                        verdict = "Time Limit Exceeded";
                        userOutput = truncateString(
                            result.data?.run?.stdout,
                            50
                        );
                    } else if (
                        removeSpecialCharacters(tc.output) ===
                        removeSpecialCharacters(result.data?.run?.stdout)
                    ) {
                        verdict = "Accepted";
                        userOutput = result.data?.run?.stdout;
                    }
                    const singleResult: ResponseTestCase = {
                        input: truncateString(tc.input, 50),
                        output: truncateString(tc.output, 50),
                        userOutput: userOutput,
                        verdict: verdict,
                        submissionId: 0,
                    };
                    allResults.push(singleResult);
                    if (verdict !== "Accepted") break;
                } catch (err: any) {
                    promiseErr =
                        err?.response?.data?.message ||
                        "Something Went Wrong! Please Try Again.";
                    break;
                }
            }
            return allResults;
        };

        let allResults = await processTestCases();
        if (promiseErr) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: promiseErr,
            });
        }
        const newSubmission = await prisma.submission.create({
            data: {
                code,
                result: allResults.every((res) => res?.verdict === "Accepted")
                    ? "Accepted"
                    : "Not Accepted",
                userId,
                problemId,
                language,
            },
        });
        allResults = allResults.map((result, index) => {
            return {
                ...result,
                submissionId: newSubmission.id,
            };
        });
        const newTestSubmissions = await prisma.responseTestCase.createMany({
            data: allResults,
        });
        return res.status(200).json({
            success: true,
            message: "Code Submitted!",
            submissionId: newSubmission.id,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const runSample: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            code: Joi.string().required().messages({
                "string.base": "Code should be a type of text",
                "string.empty": "Code cannot be an empty field",
                "any.required": "Code is a required field",
            }),
            language: Joi.valid(
                "c",
                "c++",
                "go",
                "python",
                "java",
                "javascript"
            ).messages({
                "any.required": "Language is required and cannot be empty",
            }),
            userId: Joi.number().required().strict().messages({
                "number.base": "User Id must be a number",
                "any.required": "User Id are required and cannot be empty",
            }),
            problemId: Joi.number().required().strict().messages({
                "number.base": "Problem Id must be a number",
                "any.required": "Problem Id are required and cannot be empty",
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
        const { code, userId, problemId, language } = req.body;
        const sampleTestCases = await prisma.testCase.findMany({
            where: {
                problemId: problemId,
                sample: true,
            },
        });

        let promiseErr = "";
        const processTestCases = async () => {
            const allResults: any[] = [];
            for (const [idx, tc] of sampleTestCases.entries()) {
                if (idx !== 0) {
                    await delay(250);
                }
                try {
                    const result = await axios.post(
                        "https://emkc.org/api/v2/piston/execute",
                        {
                            language: language,
                            version: map[language].version,
                            files: [
                                {
                                    content: code,
                                },
                            ],
                            stdin: tc.input,
                            args: [],
                            compile_timeout: 10000,
                            run_timeout: 3000,
                            compile_memory_limit: -1,
                            run_memory_limit: -1,
                        }
                    );
                    let verdict:
                        | "Accepted"
                        | "Wrong Answer"
                        | "Runtime Error"
                        | "Time Limit Exceeded"
                        | "Segmentation fault"
                        | "Compile Error"
                        | "Memory Limit Exceed" = "Wrong Answer";
                    let userOutput = result.data?.run?.stdout;
                    if ((result.data?.compile?.stderr as string)?.length > 0) {
                        verdict = "Compile Error";
                        userOutput = result.data?.compile?.stderr;
                    } else if (
                        (result.data?.run?.stderr as string)?.length > 0
                    ) {
                        verdict = "Runtime Error";
                        userOutput = result.data?.run?.stderr;
                    } else if (result.data?.run?.signal === "SIGKILL") {
                        verdict = "Time Limit Exceeded";
                        userOutput = truncateString(
                            result.data?.run?.stdout,
                            50
                        );
                    } else if (
                        removeSpecialCharacters(tc.output) ===
                        removeSpecialCharacters(result.data?.run?.stdout)
                    ) {
                        verdict = "Accepted";
                        userOutput = result.data?.run?.stdout;
                    }
                    const singleResult: ResponseTestCase = {
                        input: truncateString(tc.input, 50),
                        output: truncateString(tc.output, 50),
                        problemId: tc.problemId,
                        sample: tc.sample,
                        userOutput: userOutput,
                        verdict: verdict,
                        submissionId: 0,
                    };
                    allResults.push(singleResult);
                } catch (err: any) {
                    promiseErr =
                        err?.response?.data?.message ||
                        "Something Went Wrong! Please Try Again.";
                    break;
                }
            }
            return allResults;
        };

        const allResults = await processTestCases();
        if (promiseErr) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: promiseErr,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Result Generated!",
            data: allResults,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getAllSubmissions: RequestHandler = async (req, res) => {
    try {
        const { problemId, search } = req.query as { problemId: string, search: string };
        let { page, limit } = req.query as Record<string, string>;
        if (!page) page = "1";
        if (!limit) limit = "10";
        const limited = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * limited;
        let searchParams: {
            problemId?: number;
            problem?: object;
            title?: object;
        } = {};
        if(problemId && problemId !== "null") {
            searchParams["problemId"] = parseInt(problemId);
        }
        if(search) {
            searchParams["problem"] = {
                title: {
                    contains: search.trim(),
                    mode: "insensitive",
                }
            }
        }
        const totalCount = await prisma.submission.count({
            where: searchParams,
          });
        const allSubmissions = await prisma.submission.findMany({
            where: searchParams,
            select: {
                id: true,
                createdAt: true,
                result: true,
                user: {
                    select: {
                        username: true,
                    },
                },
                language: true,
                problem: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        tags: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: skip,
            take: limited
        });
        return res.status(200).json({
            success: true,
            data: allSubmissions,
            total: totalCount
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const getMySubmissions: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { problemId, search} = req.query as { problemId: string, search: string };
        let { page, limit } = req.query as Record<string, string>;
        if (!page) page = "1";
        if (!limit) limit = "10";
        const limited = parseInt(limit, 10);
        const skip = (parseInt(page, 10) - 1) * limited;

        if(parseInt(id) !== req.auth?.id) {
            return defaultErrorHandler({res, status:401, message: "You are not allowed to see this submission!"})
        }
        let searchParams: {
            problemId?: number;
            problem?: object;
            userId?: number;
            title?: object;
        } = {};
        if(problemId && problemId !== "null") {
            searchParams["problemId"] = parseInt(problemId);
        }
        if(id) {
            searchParams["userId"] = parseInt(id);
        }
        if(search) {
            searchParams["problem"] = {
                title: {
                    contains: search.trim(),
                    mode: "insensitive",
                }
            }
        }
        const totalCount = await prisma.submission.count({
            where: searchParams,
          });
        const allSubmissions = await prisma.submission.findMany({
            where: searchParams,
            select: {
                id: true,
                createdAt: true,
                result: true,
                language: true,
                user: {
                    select: {
                        username: true,
                    },
                },
                problem: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        tags: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            skip: skip,
            take: limited
        });
        return res.status(200).json({
            success: true,
            data: allSubmissions,
            total: totalCount
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};

export const getSubmissionById: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const allSubmissions = await prisma.submission.findFirst({
            where: req.auth?.role === "ADMIN" ? {
                id: parseInt(id),
            } : {
                id: parseInt(id),
                userId: req.auth?.id
            },
            select: {
                id: true,
                createdAt: true,
                result: true,
                language: true,
                user: {
                    select: {
                        username: true,
                    },
                },
                problem: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        tags: true,
                    },
                },
                code: true,
                testCases: true,
            },
        });
        return res.status(200).json({
            success: true,
            data: allSubmissions,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
