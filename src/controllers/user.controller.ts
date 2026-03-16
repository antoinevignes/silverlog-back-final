import z from "zod";
import type { Request, Response } from "express";
import {
  getUserModel,
  updateUsernameModel,
  updateLocationModel,
  updateAvatarPathModel,
  updateBannerPathModel,
  deleteUserModel,
  searchUsersModel,
} from "../models/user.model.js";
import {
  deleteAvatarFromCloudinary,
  deleteBannerFromCloudinary,
} from "../utils/cloudinary.js";
import { regenerateTokensAndSetCookies } from "../utils/auth.js";

// RECUPERER LES INFOS DE L'UTILISATEUR
export async function getUser(req: Request, res: Response) {
  const { user_id } = req.params;
  const current_user_id = req.user?.id;

  if (!user_id) throw new Error("Utilisateur introuvable");

  const user = await getUserModel(String(user_id), current_user_id);

  if (!user) throw new Error("Utilisateur introuvable");

  return res.status(200).json(user);
}

// MODIFIER LE NOM D'UTILISATEUR
export async function updateUsername(req: Request, res: Response) {
  const user = req.user!;
  const { username } = z
    .object({ username: z.string().trim().min(1) })
    .parse(req.body);

  // We need to check if username exists. Let's assume we import a checkUserExists function from auth module or something.
  // Oh wait, checkUserExists is in auth.model.ts now. I need to import it!
  const { checkUserExists } = await import("../models/auth.model.js");

  const exists = await checkUserExists("", username);
  if (exists.usernameExists) throw new Error("Nom d'utilisateur déjà utilisé");

  await updateUsernameModel(user.id, username);
  await regenerateTokensAndSetCookies(req, res, user, { username });

  return res.status(200).json({ success: true, username });
}

// MODIFIER LA LOCALISATION
export async function updateLocation(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { location } = z
    .object({ location: z.string().trim() })
    .parse(req.body);

  await updateLocationModel(user_id, location);

  return res.status(200).json({ success: true });
}

// MODIFIER L'AVATAR
export async function updateAvatar(req: Request, res: Response) {
  const user = req.user!;

  if (!req.file) throw new Error("Aucun fichier reçu");

  const file = req.file as any;
  const publicId: string = file.filename || file.public_id;
  const avatar_path = publicId.split("/").pop()!;

  await updateAvatarPathModel(user.id, avatar_path);
  await regenerateTokensAndSetCookies(req, res, user, { avatar_path });

  return res.status(200).json({ success: true, avatar_path });
}

// SUPPRIMER L'AVATAR
export async function deleteAvatar(req: Request, res: Response) {
  const user = req.user!;

  const dbUser = await getUserModel(user.id);

  if (dbUser?.avatar_path) {
    await deleteAvatarFromCloudinary(dbUser.avatar_path);
  }

  await updateAvatarPathModel(user.id, null);
  await regenerateTokensAndSetCookies(req, res, user, { avatar_path: null });

  return res.status(200).json({ success: true });
}

// MODIFIER LE BANNER
export async function updateBanner(req: Request, res: Response) {
  const user = req.user!;

  if (!req.file) throw new Error("Aucun fichier reçu");

  const file = req.file as any;
  const publicId: string = file.filename || file.public_id;
  const banner_path = publicId.split("/").pop()!;

  await updateBannerPathModel(user.id, banner_path);
  await regenerateTokensAndSetCookies(req, res, user, { banner_path });

  return res.status(200).json({ success: true, banner_path });
}

// SUPPRIMER LE BANNER
export async function deleteBanner(req: Request, res: Response) {
  const user = req.user!;

  const dbUser = await getUserModel(user.id);

  if (dbUser?.banner_path) {
    await deleteBannerFromCloudinary(dbUser.banner_path);
  }

  await updateBannerPathModel(user.id, null);
  await regenerateTokensAndSetCookies(req, res, user, { banner_path: null });

  return res.status(200).json({ success: true });
}

// SUPPRIMER LE COMPTE UTILISATEUR
export async function deleteAccount(req: Request, res: Response) {
  const user_id = req.user!.id;

  await deleteUserModel(user_id);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  } as const;

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return res
    .status(200)
    .json({ success: true, message: "Compte supprimé avec succès" });
}

// RECHERCHER DES UTILISATEURS
export async function searchUsers(req: Request, res: Response) {
  const { q } = z.object({ q: z.string().min(1) }).parse(req.query);

  const users = await searchUsersModel(q);

  return res.status(200).json(users);
}
