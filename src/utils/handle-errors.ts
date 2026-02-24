import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation échouée",
      details: err.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
  } else if (err instanceof Error) {
    return res.status(400).json({ message: err.message });
  } else {
    return res.status(500).json({ message: "Erreur inconnue" });
  }
}
