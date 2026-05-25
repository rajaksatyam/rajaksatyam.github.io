import type{ Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

export const validate = (schema: z.Schema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // We use parseAsync in case you ever add async database checks in Zod
      const validatedData = await schema.parseAsync(req.body);
      
      // Sanitization: Only the fields in your schema make it to req.body
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
      }
      next(error);
    }
  };
};