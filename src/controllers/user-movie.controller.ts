import type { Request, Response } from "express";
import {
  deleteRatingModel,
  getSeenMoviesModel,
  getStateModel,
  updateSeenDateModel,
  upsertRatingModel,
} from "../models/user-movie.model.js";

export async function getState(req: Request, res: Response) {
  const { movie_id } = req.params;

  if (!movie_id) {
    return res.status(400).json({ error: "Movie ID  requis" });
  }

  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(200).json({
      rating: null,
      seen: false,
      lists: [],
    });
  }

  const state = await getStateModel(user_id, String(movie_id));

  return res.status(200).json(state);
}

export async function upsertRating(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = req.params;
  const { rating } = req.body;

  if (!movie_id || !rating || rating === null) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  const state = await upsertRatingModel(user_id, String(movie_id), rating);

  return res.status(200).json({
    success: true,
    state,
  });
}

export async function deleteRating(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = req.params;

  if (!movie_id) {
    return res.status(400).json({ error: "Movie ID  requis" });
  }

  await deleteRatingModel(user_id, String(movie_id));

  return res.status(200).json({ success: true });
}

export async function updateSeenDate(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = req.params;
  const { date } = req.body;

  if (!movie_id) {
    return res.status(400).json({ error: "Movie ID  requis" });
  }

  await updateSeenDateModel(date, user_id, String(movie_id));

  return res.status(200).json({ success: true });
}

export async function getSeenMovies(req: Request, res: Response) {
  const user_id = req.user!.id;

  const seenMovies = await getSeenMoviesModel(user_id);

  return res.status(200).json(seenMovies);
}
