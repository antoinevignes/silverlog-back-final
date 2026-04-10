import type { Request, Response } from "express";
import {
  deleteRatingModel,
  getSeenMoviesModel,
  getSeenMoviesModel,
  getStateModel,
  updateSeenDateWithMovieModel,
  upsertRatingWithMovieModel,
  removeFromDiarylModel,
} from "../models/user-movie.model.js";
import {
  userMovieParamSchema,
  seenMovieSchema,
  ratingMovieSchema,
} from "../schemas/index.js";

// RECUPERER L'ETAT UTILISATEUR D'UN FILM
export async function getState(req: Request, res: Response) {
  const { movie_id } = userMovieParamSchema.parse(req.params);

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
  const { movie_id } = userMovieParamSchema.parse(req.params);
  const movieData = ratingMovieSchema.parse(req.body);

  const state = await upsertRatingWithMovieModel(
    user_id,
    movie_id,
    movieData.rating,
    movieData,
  );

  return res.status(200).json({
    success: true,
    state,
  });
}

// SUPPRIMER LA NOTE D'UN FILM
export async function deleteRating(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = userMovieParamSchema.parse(req.params);

  await deleteRatingModel(user_id, String(movie_id));

  return res.status(200).json({ success: true });
}

// MODIFIER LA DATE DE VISIONNAGE D'UN FILM
export async function updateSeenDate(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = userMovieParamSchema.parse(req.params);
  const movieData = seenMovieSchema.parse(req.body);

  await updateSeenDateWithMovieModel(
    user_id,
    movie_id,
    movieData.date ? new Date(movieData.date) : null,
    movieData.title ? movieData : undefined,
  );

  return res.status(200).json({ success: true });
}

// RECUPERER LES FILMS VUS PAR L'UTILISATEUR
export async function getSeenMovies(req: Request, res: Response) {
  const user_id = req.user!.id;

  const seenMovies = await getSeenMoviesModel(user_id);

  return res.status(200).json(seenMovies);
}

// SUPPRIMER UN FILM DU JOURNAL
export async function removeFromDiary(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { movie_id } = userMovieParamSchema.parse(req.params);

  await removeFromDiarylModel(user_id, movie_id);

  return res.status(200).json({ success: true });
}
