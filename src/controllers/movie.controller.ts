import type { Request, Response } from "express";
import { getMovieDataModel, getCrewPicksModel } from "../models/movie.model.js";

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
