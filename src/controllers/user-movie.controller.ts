import type { Request, Response } from "express";
import {
  deleteRatingModel,
  getSeenMoviesModel,
  getStateModel,
  updateSeenDateModel,
  upsertRatingModel,
} from "../models/user-movie.model.js";
import { upsertMovieModel } from "../models/movie.model.js";

import z from "zod";

const movieParamSchema = z.object({
  movie_id: z.coerce.number(),
});

const seenMovieSchema = z.object({
  date: z.any().optional(),
  title: z.string(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).nullable(),
});

// RECUPERER L'ETAT UTILISATEUR D'UN FILM
export async function getState(req: Request, res: Response) {
  const { movie_id } = movieParamSchema.parse(req.params);

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

// AJOUTER OU MODIFIER LA NOTE D'UN FILM
export async function upsertRating(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = movieParamSchema.parse(req.params);
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

// SUPPRIMER LA NOTE D'UN FILM
export async function deleteRating(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = movieParamSchema.parse(req.params);

  await deleteRatingModel(user_id, String(movie_id));

  return res.status(200).json({ success: true });
}

// MODIFIER LA DATE DE VISIONNAGE D'UN FILM
export async function updateSeenDate(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = movieParamSchema.parse(req.params);
  const { date, title, release_date, poster_path, backdrop_path, genres } =
    seenMovieSchema.parse(req.body);

  if (title && movie_id) {
    await upsertMovieModel(
      movie_id,
      title,
      release_date,
      poster_path,
      backdrop_path,
      genres,
    );
  }

  await updateSeenDateModel(date, user_id, String(movie_id));

  return res.status(200).json({ success: true });
}

// RECUPERER LES FILMS VUS PAR L'UTILISATEUR
export async function getSeenMovies(req: Request, res: Response) {
  const user_id = req.user!.id;

  const seenMovies = await getSeenMoviesModel(user_id);

  return res.status(200).json(seenMovies);
}
