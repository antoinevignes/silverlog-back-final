import type { Request, Response } from "express";
import {
  createListModel,
  deleteListModel,
  findListById,
  getListDetailsModel,
  getListsModel,
  getPublicListsModel,
  getUserCustomListsModel,
  toggleMovieInListModel,
  toggleSaveListModel,
  updateListModel,
  updateListOrderModel,
  removeMovieFromListModel,
} from "../models/list.model.js";
import { upsertMovieModel } from "../models/movie.model.js";
import {
  listSchema,
  listParamsSchema,
  toggleMovieSchema,
  listUpdateSchema,
  listReorderSchema,
  listAndMovieParamsSchema,
} from "../schemas/index.js";

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

// RECUPERER DETAILS D'UNE LISTE
export async function getListDetails(req: Request, res: Response) {
  const user_id = req.user?.id || null;
  const { list_id } = listParamsSchema.parse(req.params);

  const watchlist = await getListDetailsModel(String(list_id), user_id);

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
  const user_id = req.user!.id;
  const { list_id } = listParamsSchema.parse(req.params);

  const listExists = await findListById(Number(list_id));
  if (!listExists) {
    throw new Error("Cette liste n'existe pas");
  }

  if (listExists.user_id !== user_id) {
    return res.status(403).json({ error: "Accès interdit" });
  }

  await deleteListModel(Number(list_id));

  return res.status(200).json({ success: "Liste supprimée" });
}

// RECUPERER LES LISTES PUBLIQUES
export async function getPublicLists(req: Request, res: Response) {
  const lists = await getPublicListsModel();

  return res.status(200).json(lists);
}

// RECUPERER LES LISTES PERSO
export async function getUserCustomLists(req: Request, res: Response) {
  const { user_id } = req.params;

  const { is_public } = req.query;

  if (!user_id) throw new Error("Utilisateur introuvable");

  const lists = await getUserCustomListsModel(
    String(user_id),
    is_public === "true",
  );

  return res.status(200).json(lists);
}

// TOGGLE SAUVEGARDER UNE LISTE
export async function toggleSaveList(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { list_id } = listParamsSchema.parse(req.params);

  const result = await toggleSaveListModel(user_id, Number(list_id));

  return res.status(200).json({
    success: true,
    action: result.action,
  });
}

// METTRE A JOUR UNE LISTE
export async function updateList(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { list_id } = listParamsSchema.parse(req.params);

  const updates = listUpdateSchema.parse(req.body);

  const list = await findListById(list_id);

  if (!list) {
    return res.status(404).json({ error: "Liste introuvable" });
  }

  if (Number(list.user_id) !== Number(user_id)) {
    return res.status(403).json({ error: "Accès interdit" });
  }

  const updatedList = await updateListModel(list_id, updates);

  return res.status(200).json(updatedList);
}

// SUPPRIMER UN FILM D'UNE LISTE (DÉDIÉ)
export async function removeMovieFromList(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { list_id, movie_id } = listAndMovieParamsSchema.parse(req.params);

  await removeMovieFromListModel(user_id, list_id, movie_id);

  return res.status(200).json({ success: true });
}

// REORGANISER UNE LISTE
export async function updateListOrder(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { list_id } = listParamsSchema.parse(req.params);

  const { movie_ids } = listReorderSchema.parse(req.body);

  await updateListOrderModel(user_id, Number(list_id), movie_ids);

  return res.status(200).json({ success: true });
}
