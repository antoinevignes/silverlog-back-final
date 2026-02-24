import type { Request, Response } from "express";
import { getMovieDataModel } from "../models/movie.model.js";

export async function getMovieData(req: Request, res: Response) {
  const { movie_id } = req.params;

  const data = await getMovieDataModel(String(movie_id));

  return res.status(200).json(data);
}
