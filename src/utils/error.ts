import { Response } from "express";

export const defaultErrorHandler = ({
    res,
    status,
    message,
    error,
  }: {
    res: Response;
    status?: number;
    message?: string;
    error?: any;
  }) => {
    return res.status(status || 500).json({
      success: false,
      message: message || "Something went wrong",
    });
  };