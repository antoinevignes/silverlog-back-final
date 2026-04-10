import type { Request, Response } from "express";
import {
  followUserModel,
  unfollowUserModel,
  getFollowersModel,
  getFollowingModel,
  getFollowingActivityModel,
} from "../models/follow.model.js";
import { createNotificationModel } from "../models/notification.model.js";
import { getIO } from "../socket.js";
import sql from "../db.js";

// SUIVRE UN UTILISATEUR
export async function followUser(req: Request, res: Response) {
  const follower_id = req.user!.id;
  const following_id = String(req.params.id);

  if (follower_id === following_id) {
    return res.status(400).json({
      success: false,
      message: "Vous ne pouvez pas vous suivre vous-même",
    });
  }

  await followUserModel(follower_id, following_id);

  // Créer une notification pour l'utilisateur suivi
  const notification = await createNotificationModel(
    following_id,
    follower_id,
    "follow",
    null,
    null,
    null,
  );

  // Récupérer les infos de l'utilisateur qui suit
  const sender = await sql`
    SELECT username, avatar_path FROM users WHERE id = ${follower_id}
  `;

  // Émettre la notification en temps réel
  const io = getIO();
  io.to(`user:${following_id}`).emit("notification", {
    id: notification?.id,
    type: "follow",
    sender_id: Number(follower_id),
    sender_username: sender[0]?.username,
    sender_avatar: sender[0]?.avatar_path,
    movie_id: null,
    movie_title: null,
    movie_poster: null,
    created_at: notification?.created_at,
  });

  return res.status(200).json({ success: true, message: "Utilisateur suivi" });
}

// NE PLUS SUIVRE
export async function unfollowUser(req: Request, res: Response) {
  const follower_id = req.user!.id;
  const following_id = String(req.params.id);

  await unfollowUserModel(follower_id, following_id);
  return res
    .status(200)
    .json({ success: true, message: "Abonnement supprimé" });
}

// RECUPERER LES FOLLOWERS
export async function getFollowers(req: Request, res: Response) {
  const id = String(req.params.id);
  const followers = await getFollowersModel(id);
  return res.status(200).json(followers);
}

// RECUPERER LES ABONNEMENTS
export async function getFollowing(req: Request, res: Response) {
  const id = String(req.params.id);
  const following = await getFollowingModel(id);
  return res.status(200).json(following);
}

// RECUPERER LE FLUX D'ACTIVITE DES ABONNEMENTS
export async function getFollowingActivity(req: Request, res: Response) {
  const user_id = req.user!.id;
  const activity = await getFollowingActivityModel(user_id);
  return res.status(200).json(activity);
}
