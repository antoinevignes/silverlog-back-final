import type { Request, Response } from "express";
import { z } from "zod";
import {
  getAdminStatsModel,
  getAdminUsersModel,
  updateUserRoleModel,
  deleteUserModel,
  getAdminReviewsModel,
  deleteAdminReviewModel,
} from "../models/admin.model.js";

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

const deleteReviewParams = z.object({
  reviewId: z.coerce.number(),
});

// GET STATS
export async function getStats(req: Request, res: Response) {
  const stats = await getAdminStatsModel();
  return res.status(200).json(stats);
}

// GET USERS
export async function getUsers(req: Request, res: Response) {
  const users = await getAdminUsersModel();
  return res.status(200).json(users);
}

// PATCH USER ROLE
export async function updateUserRole(req: Request, res: Response) {
  const userId = req.params.userId as string;
  const { role } = updateRoleSchema.parse(req.body);

  if (userId === req.user?.id) {
    return res
      .status(403)
      .json({ error: "Vous ne pouvez pas modifier votre propre rôle." });
  }

  await updateUserRoleModel(userId, role);
  return res
    .status(200)
    .json({ success: true, message: "Rôle modifié avec succès" });
}

// DELETE USER
export async function deleteUser(req: Request, res: Response) {
  const userId = req.params.userId as string;

  if (userId === req.user?.id) {
    return res.status(403).json({
      error:
        "Vous ne pouvez pas supprimer votre propre compte depuis ce panel.",
    });
  }

  await deleteUserModel(userId);
  return res
    .status(200)
    .json({ success: true, message: "Utilisateur supprimé" });
}

// GET REVIEWS
export async function getReviews(req: Request, res: Response) {
  const reviews = await getAdminReviewsModel();
  return res.status(200).json(reviews);
}

// DELETE REVIEW

export async function deleteReview(req: Request, res: Response) {
  const { reviewId } = deleteReviewParams.parse(req.params);
  await deleteAdminReviewModel(reviewId);
  return res.status(200).json({ success: true, message: "Avis supprimé" });
}
