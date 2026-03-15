import type { Request, Response } from "express";
import {
  getMovieDataModel,
  getCrewPicksModel,
  getFriendsMovieActivityModel,
} from "../models/movie.model.js";
import z from "zod";

const paramsSchema = z.object({
  movie_id: z.coerce.number(),
});

export async function getMovieData(req: Request, res: Response) {
  const { movie_id } = paramsSchema.parse(req.params);

  const data = await getMovieDataModel(String(movie_id));

  return res.status(200).json(data);
}

export async function getCrewPicks(req: Request, res: Response) {
  const picks = await getCrewPicksModel();
  return res.status(200).json(picks);
}

// RECUPERER L'ACTIVITE DES AMIS POUR UN FILM
export async function getFriendsMovieActivity(req: Request, res: Response) {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(200).json([]);
  }

  const movie_id = String(req.params.movie_id);
  const activity = await getFriendsMovieActivityModel(user_id, movie_id);
  return res.status(200).json(activity);
}
