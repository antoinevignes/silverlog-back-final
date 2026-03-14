import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  deleteRefreshTokenByIdModel,
  getUserRefreshTokensModel,
  storeRefreshTokenModel,
} from "../models/auth.model.js";

// HELPER LOCAL POUR REGENERER LES TOKENS
export async function regenerateTokensAndSetCookies(
  req: Request,
  res: Response,
  user: any,
  overrides: any,
) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    top_list_id: user.top_list_id,
    watchlist_id: user.watchlist_id,
    avatar_path: user.avatar_path,
    backdrop_path: user.backdrop_path,
    ...overrides,
  };

  const newAccessToken = jwt.sign(payload, process.env.ACCESS_SECRET!, {
    expiresIn: "15m",
  });
  const newRefreshToken = jwt.sign(payload, process.env.REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  const oldRefreshToken = req.cookies.refreshToken;
  if (oldRefreshToken) {
    const dbTokens = await getUserRefreshTokensModel(user.id);
    for (const t of dbTokens) {
      if (await bcrypt.compare(oldRefreshToken, t.token)) {
        await deleteRefreshTokenByIdModel(t.id);
        break;
      }
    }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 14);
  await storeRefreshTokenModel(user.id, hashedNewRefreshToken, expiresAt);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  } as const;

  res.cookie("accessToken", newAccessToken, cookieOptions);
  res.cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
