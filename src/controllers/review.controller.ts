import type { Request, Response } from "express";
import {
  createReviewModel,
  deleteReviewModel,
  getReviewModel,
  getReviewsModel,
  likeReviewModel,
  getRecentReviewsModel,
  getPopularReviewsModel,
} from "../models/review.model.js";
import { reviewSchema, reviewMovieParamSchema, reviewParamSchema } from "../schemas/index.js";

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
  const { movie_id } = reviewMovieParamSchema.parse(req.params);

  const review = await getReviewModel(String(movie_id), user_id);

  if (!review) {
    return res.status(200).json(null);
  }

  return res.status(200).json(review);
}

export async function getReviewsByMovie(req: Request, res: Response) {
  const user_id = req.user?.id ?? null;
  const { movie_id } = reviewMovieParamSchema.parse(req.params);

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

export async function getPopularReviews(req: Request, res: Response) {
  const limit = Number(req.query.limit) || 10;
  const reviews = await getPopularReviewsModel(limit);
  return res.status(200).json(reviews);
}
