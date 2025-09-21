import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors || error.message,
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      (req as any).query = parsed;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: "Query validation error",
        details: error.errors || error.message,
      });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.params);
      (req as any).params = parsed;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: "Params validation error",
        details: error.errors || error.message,
      });
    }
  };
};
