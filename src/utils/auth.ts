import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  deleteRefreshTokenByIdModel,
  getUserRefreshTokensModel,
  storeRefreshTokenModel,
} from "../models/auth.model.js";

// PAYLOAD UNIQUE POUR TOUTE L'APP
export function generateUserPayload(user: any, overrides: any = {}) {
  return {
    id: user.id || user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    top_list_id: user.top_list_id,
    watchlist_id: user.watchlist_id,
    avatar_path: user.avatar_path,
    banner_path: user.banner_path,
    ...overrides,
  };
}

// HELPER UNIQUE POUR REGENERER LES TOKENS ET POSER LES COOKIES
export async function regenerateTokensAndSetCookies(
  req: Request,
  res: Response,
  user: any,
  overrides: any = {},
) {
  const payload = generateUserPayload(user, overrides);

  const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET!, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  // GESTION DU REFRESH TOKEN EN BASE
  const oldRefreshToken = req.cookies.refreshToken;
  if (oldRefreshToken) {
    const dbTokens = await getUserRefreshTokensModel(payload.id);
    for (const t of dbTokens) {
      if (await bcrypt.compare(oldRefreshToken, t.token)) {
        await deleteRefreshTokenByIdModel(t.id);
        break;
      }
    }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hashedNewRefreshToken = await bcrypt.hash(refreshToken, 12);
  await storeRefreshTokenModel(payload.id, hashedNewRefreshToken, expiresAt);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  } as const;

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken, payload };
}
