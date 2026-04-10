import type { Request, Response } from "express";
import {
  getMovieDataModel,
  getCrewPicksModel,
  updateCrewPicksModel,
  getFriendsMovieActivityModel,
  getMoviesRatingsModel,
  upsertMovieModel,
} from "../models/movie.model.js";
import dotenv from "dotenv";
import { movieParamsSchema, updateCrewPicksSchema } from "../schemas/index.js";

dotenv.config();

// RECUPERER LES DONNEES D'UN FILM
export async function getMovieData(req: Request, res: Response) {
  const { movie_id } = movieParamsSchema.parse(req.params);

  const data = await getMovieDataModel(String(movie_id));

  return res.status(200).json(data);
}

// RECUPERER LES FILMS SELECTIONNES PAR L'EQUIPE
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

  const { movie_id } = movieParamsSchema.parse(req.params);
  const activity = await getFriendsMovieActivityModel(
    user_id,
    String(movie_id),
  );
  return res.status(200).json(activity);
}

// METTRE A JOUR LES FILMS SELECTIONNES PAR L'EQUIPE
export async function updateCrewPicks(req: Request, res: Response) {
  const adminId = req.user?.id;
  if (!adminId) return res.status(401).json({ error: "Non autorisé" });

  const { movies } = updateCrewPicksSchema.parse(req.body);

  for (const movie of movies) {
    await upsertMovieModel(
      movie.id,
      movie.title,
      movie.release_date || null,
      movie.poster_path || null,
      movie.backdrop_path || null,
      movie.genres || null,
    );
  }

  await updateCrewPicksModel(
    movies.map((m) => m.id),
    adminId,
  );

  return res
    .status(200)
    .json({ success: true, message: "Sélection mise à jour" });
}

// RECUPERER LES FILMS LES MIEUX NOTES
export async function getTopRatedMovies(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const language = (req.query.language as string) || "fr-FR";

  const url = `${process.env.TMDB_URL}/movie/top_rated?language=${language}&page=${page}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  });

  const tmdbData = await response.json();
  const tmdbMovies = tmdbData.results || [];

  const movieIds = tmdbMovies.map((m: any) => m.id);
  const silverlogRatings = await getMoviesRatingsModel(movieIds);

  const ratingsMap = new Map(
    silverlogRatings.map((r: any) => [
      r.movie_id,
      { avg: Number(r.avg_rating), count: r.count },
    ]),
  );

  const moviesWithWeightedAvg = tmdbMovies.map((movie: any) => {
    const silverlog = ratingsMap.get(movie.id);

    let weightedAvg: number;

    if (silverlog && silverlog.count > 0) {
      const tmdbAvg = movie.vote_average;
      const tmdbCount = movie.vote_count;
      const silverlogAvg = silverlog.avg / 2;
      const silverlogCount = silverlog.count;

      weightedAvg =
        (tmdbAvg * tmdbCount + silverlogAvg * silverlogCount) /
        (tmdbCount + silverlogCount);
    } else {
      weightedAvg = movie.vote_average;
    }

    return {
      ...movie,
      weighted_avg: Math.round(weightedAvg * 10) / 10,
      silverlog_avg: silverlog ? silverlog.avg / 2 : null,
      silverlog_count: silverlog ? silverlog.count : 0,
    };
  });

  moviesWithWeightedAvg.sort(
    (a: any, b: any) => b.weighted_avg - a.weighted_avg,
  );

  return res.status(200).json({
    results: moviesWithWeightedAvg,
    page: tmdbData.page,
    total_pages: tmdbData.total_pages,
    total_results: tmdbData.total_results,
  });
}
