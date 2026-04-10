import type { Request, Response } from "express";
import type { Multer } from "multer";
import {
  getUserModel,
  updateUsernameModel,
  updateLocationModel,
  updateDescriptionModel,
  updateAvatarPathModel,
  updateBannerPathModel,
  deleteUserModel,
  searchUsersModel,
  updatePasswordModel,
  getActiveUsersModel,
} from "../models/user.model.js";
import { checkUserExists, signInModel } from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import {
  deleteAvatarFromCloudinary,
  deleteBannerFromCloudinary,
} from "../utils/cloudinary.js";
import { getCookieOptions, updateTokensAndSetCookies } from "../utils/auth.js";
import {
  passwordSchema,
  searchQuerySchema,
  usernameSchema,
  locationSchema,
  descriptionSchema,
} from "../schemas/index.js";

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  public_id?: string;
}

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
  const { username } = usernameSchema.parse(req.body);

  const exists = await checkUserExists("", username);
  if (exists.usernameExists) throw new Error("Nom d'utilisateur déjà utilisé");

  await updateUsernameModel(user.id, username);
  await updateTokensAndSetCookies(req, res, { ...user, username });

  return res.status(200).json({ success: true, username });
}

// MODIFIER LA LOCALISATION
export async function updateLocation(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { location } = locationSchema.parse(req.body);

  await updateLocationModel(user_id, location);

  return res.status(200).json({ success: true });
}

// MODIFIER LA DESCRIPTION
export async function updateDescription(req: Request, res: Response) {
  const user_id = req.user!.id;
  const { description } = descriptionSchema.parse(req.body);

  await updateDescriptionModel(user_id, description);

  return res.status(200).json({ success: true });
}

// MODIFIER L'AVATAR
export async function updateAvatar(req: Request, res: Response) {
  const user = req.user!;

  if (!req.file) throw new Error("Aucun fichier reçu");

  const file = req.file as UploadedFile;
  const publicId: string = file.filename ?? file.public_id ?? "";
  const avatar_path = publicId.split("/").pop()!;

  await updateAvatarPathModel(user.id, avatar_path);
  await updateTokensAndSetCookies(req, res, { ...user, avatar_path });

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
  await updateTokensAndSetCookies(req, res, { ...user, avatar_path: null });

  return res.status(200).json({ success: true });
}

// MODIFIER LE BANNER
export async function updateBanner(req: Request, res: Response) {
  const user = req.user!;

  if (!req.file) throw new Error("Aucun fichier reçu");

  const file = req.file as UploadedFile;
  const publicId: string = file.filename ?? file.public_id ?? "";
  const banner_path = publicId.split("/").pop()!;

  await updateBannerPathModel(user.id, banner_path);
  await updateTokensAndSetCookies(req, res, { ...user, banner_path });

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
  await updateTokensAndSetCookies(req, res, { ...user, banner_path: null });

  return res.status(200).json({ success: true });
}

// SUPPRIMER LE COMPTE UTILISATEUR
export async function deleteAccount(req: Request, res: Response) {
  const user_id = req.user!.id;

  await deleteUserModel(user_id);

  const options = getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);

  return res
    .status(200)
    .json({ success: true, message: "Compte supprimé avec succès" });
}

// RECHERCHER DES UTILISATEURS
export async function searchUsers(req: Request, res: Response) {
  const { q } = searchQuerySchema.parse(req.query);

  const users = await searchUsersModel(q);

  return res.status(200).json(users);
}

export async function updatePassword(req: Request, res: Response) {
  const user = req.user!;
  const parsed = passwordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, errors: parsed.error.flatten() });
  }

  const dbUser = await signInModel(user.email);
  if (!dbUser || !dbUser.password) throw new Error("Utilisateur introuvable");

  const passwordMatch = await bcrypt.compare(
    parsed.data.currentPassword,
    dbUser.password,
  );

  if (!passwordMatch) {
    return res
      .status(401)
      .json({ success: false, message: "Mot de passe actuel incorrect" });
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await updatePasswordModel(user.id, hashedPassword);

  return res.status(200).json({ success: true });
}

// UTILISATEURS LES PLUS ACTIFS
export async function getActiveUsers(_req: Request, res: Response) {
  const users = await getActiveUsersModel(6);

  return res.status(200).json(users);
}
