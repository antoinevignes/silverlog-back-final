import type { Request, Response } from "express";
import { getMovieDataModel } from "../models/movie.model.js";

import z from "zod";

const paramsSchema = z.object({
  movie_id: z.coerce.number(),
});

export async function getMovieData(req: Request, res: Response) {
  const { movie_id } = paramsSchema.parse(req.params);

  const data = await getMovieDataModel(String(movie_id));

  return res.status(200).json(data);
}
