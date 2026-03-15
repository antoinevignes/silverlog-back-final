import type { Request, Response } from "express";
import z from "zod";
import {
  createReviewModel,
  deleteReviewModel,
  getReviewModel,
  getReviewsModel,
  likeReviewModel,
  getRecentReviewsModel,
} from "../models/review.model.js";

const reviewSchema = z.object({
  movie_id: z.coerce.number(),
  content: z.string().min(1, "Contenu requis").max(140, "Contenu trop long"),
});

const movieParamSchema = z.object({
  movie_id: z.coerce.number(),
});

const reviewParamSchema = z.object({
  review_id: z.coerce.number(),
});

export async function createReview(req: Request, res: Response) {
  const user_id = req.user!.id;

  const { movie_id, content } = reviewSchema.parse(req.body);

  const review = await createReviewModel(user_id, movie_id, content);

  return res.status(201).json({
    success: true,
    review,
  });
}

export async function getReview(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = movieParamSchema.parse(req.params);

  const review = await getReviewModel(String(movie_id), user_id);

  if (!review) {
    return res.status(200).json(null);
  }

  return res.status(200).json(review);
}

export async function getReviewsByMovie(req: Request, res: Response) {
  const user_id = req.user?.id ?? null;
  const { movie_id } = movieParamSchema.parse(req.params);

  const reviews = await getReviewsModel(user_id, String(movie_id));

  if (!reviews) {
    return res.status(200).json([]);
  }

  return res.status(200).json(reviews);
}

export async function likeReview(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { review_id } = reviewParamSchema.parse(req.params);

  await likeReviewModel(String(review_id), user_id);

  return res.status(200).json({ success: true });
}

export async function deleteReview(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { review_id } = reviewParamSchema.parse(req.params);

  await deleteReviewModel(String(review_id), user_id);

  return res.status(200).json({ success: true });
}

export async function getRecentReviews(req: Request, res: Response) {
  const reviews = await getRecentReviewsModel();
  return res.status(200).json(reviews);
}
