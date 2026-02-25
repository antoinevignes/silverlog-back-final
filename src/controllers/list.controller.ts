import type { Request, Response } from "express";
import {
  createListModel,
  deleteListModel,
  findListById,
  getListMoviesModel,
  getListsModel,
  toggleMovieInListModel,
} from "../models/list.model.js";
import z from "zod";
import { upsertMovieModel } from "../models/movie.model.js";

// TYPES
const listSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().nullable(),
  is_public: z.boolean("La liste doit être publique ou privée"),
});

export type List = z.infer<typeof listSchema>;

const listParamsSchema = z.object({
  list_id: z.coerce.number(),
});

const toggleMovieSchema = z.object({
  movie_id: z.coerce.number(),
  title: z.string(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  genres: z.array(z.object({ id: z.number(), name: z.string() })).nullable(),
});

// AJOUTER FILM A UNE LISTE
export async function toggleMovieInList(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { list_id } = listParamsSchema.parse(req.params);
  const { movie_id, title, release_date, poster_path, backdrop_path, genres } =
    toggleMovieSchema.parse(req.body);

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

  const result = await toggleMovieInListModel(
    user_id,
    String(list_id),
    movie_id,
  );

  return res.status(200).json({
    success: true,
    action: result.action,
  });
}

// RECUPERER FILMS D'UNE LISTE
export async function getListMovies(req: Request, res: Response) {
  const { list_id } = listParamsSchema.parse(req.params);

  const watchlist = await getListMoviesModel(String(list_id));

  return res.status(200).json(watchlist);
}

// RECUPERER TOUTES LES LISTES DE L'UTILISATEUR
export async function getLists(req: Request, res: Response) {
  const user_id = req.user!.id;

  const lists = await getListsModel(user_id);

  res.status(200).json(lists);
}

// CREER LISTE
export async function createList(req: Request, res: Response) {
  const user_id = req.user!.id;

  if (!req.body) {
    throw new Error("Paramètres manquants");
  }

  const parsed = listSchema.parse(req.body);

  await createListModel(user_id, parsed);

  return res.status(201).json({ success: true });
}

// SUPPRIMER UNE LISTE
export async function deleteList(req: Request, res: Response) {
  const { list_id } = listParamsSchema.parse(req.params);

  const listExists = await findListById(Number(list_id));
  if (!listExists) {
    throw new Error("Cette liste n'existe pas");
  }

  await deleteListModel(Number(list_id));

  return res.status(200).json({ success: "Liste supprimée" });
}
