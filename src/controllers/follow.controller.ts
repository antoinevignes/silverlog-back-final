import type { Request, Response } from "express";
import {
  followUserModel,
  unfollowUserModel,
  getFollowersModel,
  getFollowingModel,
  getFollowingActivityModel,
  getFriendsMovieActivityModel,
} from "../models/follow.model.js";

// SUIVRE UN UTILISATEUR
export async function followUser(req: Request, res: Response) {
  const follower_id = req.user!.id;
  const following_id = String(req.params.id);

  if (follower_id === following_id) {
    return res.status(400).json({ success: false, message: "Vous ne pouvez pas vous suivre vous-même" });
  }

  await followUserModel(follower_id, following_id);
  return res.status(200).json({ success: true, message: "Utilisateur suivi" });
}

// NE PLUS SUIVRE
export async function unfollowUser(req: Request, res: Response) {
  const follower_id = req.user!.id;
  const following_id = String(req.params.id);

  await unfollowUserModel(follower_id, following_id);
  return res.status(200).json({ success: true, message: "Abonnement supprimé" });
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

// RECUPERER L'ACTIVITE DES AMIS POUR UN FILM
export async function getFriendsMovieActivity(req: Request, res: Response) {
  const user_id = req.user!.id;
  const movie_id = String(req.params.movie_id);
  const activity = await getFriendsMovieActivityModel(user_id, movie_id);
  return res.status(200).json(activity);
}
