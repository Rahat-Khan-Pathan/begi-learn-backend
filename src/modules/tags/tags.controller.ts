import { RequestHandler } from "express";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";
import { defaultErrorHandler } from "./../../utils/error";

import { configs } from "../../configs";

const prisma = new PrismaClient();

export const getAllTags: RequestHandler = async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({orderBy: {
            createdAt: "asc"
        }});
        return res.status(200).json({
            success: true,
            data: tags,
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
export const addTags: RequestHandler = async (req, res) => {
    try {
        const schema = Joi.object({
            tagName: Joi.string().required().messages({
                "string.base": "Tag Name should be a type of text",
                "string.empty": "Tag Name cannot be an empty field",
                "any.required": "Tag Name is a required field",
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
        const { tagName } = req.body;
        const tagData = await prisma.tag.findUnique({
            where: {
                tagName,
            },
        });
        if (tagData) {
            return defaultErrorHandler({
                res,
                status: 404,
                message: "This tag is already present!",
            });
        }
        await prisma.tag.create({
            data: {
                tagName,
            },
        });
        return res.status(200).json({
            success: true,
            message: "New tag inserted. Now you can add this tag.",
        });
    } catch (err: any) {
        return defaultErrorHandler({ res, message: err?.message });
    }
};
