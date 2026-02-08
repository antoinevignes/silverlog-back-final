import type { Request, Response } from "express";
import z from "zod";
import { createReviewModel } from "../models/review.model.js";
import { handleErrors } from "../utils/handle-errors.js";

const reviewSchema = z.object({
  movie_id: z.coerce.number(),
  content: z.string().min(1, "Contenu requis").max(140, "Contenu trop long"),
});

export async function createReview(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;

    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Paramètres manquants",
      });
    }

    const { movie_id, content } = parsed.data;

    const review = await createReviewModel(user_id, movie_id, content);

    return res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    return handleErrors(error, res);
  }
}
