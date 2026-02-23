import type { Request, Response } from "express";
import {
  getListMoviesModel,
  toggleMovieInListModel,
} from "../models/list.model.js";
import { handleErrors } from "../utils/handle-errors.js";

// AJOUTER FILM A UNE LISTE
export async function toggleMovieInList(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;
    const { list_id } = req.params;
    const { movie_id } = req.body;

    if (!list_id || !movie_id) {
      throw new Error("Paramètres manquants");
    }

    const result = await toggleMovieInListModel(
      user_id,
      String(list_id),
      movie_id,
    );

    return res.status(200).json({
      success: true,
      action: result.action,
    });
  } catch (err) {
    return handleErrors(err, res);
  }
}

export async function getListMovies(req: Request, res: Response) {
  try {
    const { list_id } = req.params;

    const watchlist = await getListMoviesModel(String(list_id));

    return res.status(200).json(watchlist);
  } catch (err) {
    return handleErrors(err, res);
  }
}
