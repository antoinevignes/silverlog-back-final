import type { Request, Response } from "express";
import {
  createListModel,
  deleteListModel,
  findListById,
  getListMoviesModel,
  getListsModel,
  toggleMovieInListModel,
} from "../models/list.model.js";
import { handleErrors } from "../utils/handle-errors.js";
import z from "zod";

// TYPES
const listSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().nullable(),
  is_public: z.boolean("La liste doit être publique ou privée"),
});

export type List = z.infer<typeof listSchema>;

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

// RECUPERER FILMS D'UNE LISTE
export async function getListMovies(req: Request, res: Response) {
  try {
    const { list_id } = req.params;

    const watchlist = await getListMoviesModel(String(list_id));

    return res.status(200).json(watchlist);
  } catch (err) {
    return handleErrors(err, res);
  }
}

// RECUPERER TOUTES LES LISTES DE L'UTILISATEUR
export async function getLists(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;

    const lists = await getListsModel(user_id);

    res.status(200).json(lists);
  } catch (err) {
    return handleErrors(err, res);
  }
}

// CREER LISTE
export async function createList(req: Request, res: Response) {
  try {
    const user_id = req.user!.id;

    if (!req.body) {
      throw new Error("Paramètres manquants");
    }

    const parsed = listSchema.parse(req.body);

    await createListModel(user_id, parsed);

    return res.status(201);
  } catch (err) {
    return handleErrors(err, res);
  }
}

// SUPPRIMER UNE LISTE
export async function deleteList(req: Request, res: Response) {
  try {
    const { list_id } = req.params;

    if (!list_id) {
      throw new Error("List ID requis");
    }

    const listExists = await findListById(Number(list_id));
    if (!listExists) {
      throw new Error("Cette liste n'existe pas");
    }

    await deleteListModel(Number(list_id));

    return res.status(200).json({ success: "Liste supprimée" });
  } catch (err) {
    return handleErrors(err, res);
  }
}
