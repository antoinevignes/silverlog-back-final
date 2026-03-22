import type { Request, Response } from "express";
import {
  getMovieDataModel,
  getCrewPicksModel,
  updateCrewPicksModel,
  getFriendsMovieActivityModel,
} from "../models/movie.model.js";
import z from "zod";

const paramsSchema = z.object({
  movie_id: z.coerce.number(),
});

const updateCrewPicksSchema = z.object({
  movie_ids: z.array(z.number()).max(6),
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

  const { movie_id } = paramsSchema.parse(req.params);
  const activity = await getFriendsMovieActivityModel(
    user_id,
    String(movie_id),
  );
  return res.status(200).json(activity);
}

export async function updateCrewPicks(req: Request, res: Response) {
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ error: "Non autorisé" });

  const { movie_ids } = updateCrewPicksSchema.parse(req.body);

  await updateCrewPicksModel(movie_ids, adminId);

  return res
    .status(200)
    .json({ success: true, message: "Sélection mise à jour" });
}
