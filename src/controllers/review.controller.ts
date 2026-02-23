import type { Request, Response } from "express";
import z from "zod";
import {
  createReviewModel,
  deleteReviewModel,
  getReviewModel,
  getReviewsModel,
  likeReviewModel,
} from "../models/review.model.js";
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

export async function getReview(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { movie_id } = req.params;

    const review = await getReviewModel(String(movie_id), user_id);

    if (!review) {
      return res.status(200).json(null);
    }

    return res.status(200).json(review);
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function getReviewsByMovie(req: Request, res: Response) {
  try {
    const user_id = req.user?.id ?? null;
    const { movie_id } = req.params;

    const reviews = await getReviewsModel(user_id, String(movie_id));

    if (!reviews) {
      return res.status(200).json([]);
    }

    return res.status(200).json(reviews);
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function likeReview(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { review_id } = req.params;

    if (!review_id) {
      return res.status(400).json({ error: "Review ID  requis" });
    }

    await likeReviewModel(String(review_id), user_id);

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleErrors(error, res);
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { review_id } = req.params;

    if (!review_id) {
      return res.status(400).json({ error: "Review ID  requis" });
    }

    await deleteReviewModel(String(review_id), user_id);

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleErrors(error, res);
  }
}
