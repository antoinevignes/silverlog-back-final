import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  deleteRefreshTokenByIdModel,
  storeRefreshTokenModel,
} from "../models/auth.model.js";

import type { UserPayload, SessionUser } from "../types/db.js";
import { getCookieOptions } from "./handle-errors.js";

// PAYLOAD UNIQUE POUR TOUTE L'APP
export function generateUserPayload(
  user: SessionUser,
  overrides: Partial<UserPayload> = {},
): UserPayload {
  return {
    id: String(user.id || user.user_id),
    username: user.username,
    email: user.email,
    role: user.role,
    top_list_id: user.top_list_id ?? null,
    watchlist_id: user.watchlist_id ?? null,
    avatar_path: user.avatar_path ?? null,
    banner_path: user.banner_path ?? null,
    ...overrides,
  };
}

// HELPER UNIQUE POUR REGENERER LES TOKENS ET POSER LES COOKIES
export async function regenerateTokensAndSetCookies(
  req: Request,
  res: Response,
  user: SessionUser,
  overrides: Partial<UserPayload> = {},
) {
  const payload = generateUserPayload(user, overrides);

  const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET!, {
    expiresIn: "15m",
  });

  const tempRefreshToken = jwt.sign(payload, process.env.REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  const oldRefreshToken = req.cookies.refreshToken;
  if (oldRefreshToken) {
    const oldDecoded = jwt.decode(oldRefreshToken) as UserPayload | null;
    if (oldDecoded?.token_id) {
      await deleteRefreshTokenByIdModel(oldDecoded.token_id);
    }
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const hashedRefreshToken = await bcrypt.hash(tempRefreshToken, 12);
  const tokenId = await storeRefreshTokenModel(
    payload.id,
    hashedRefreshToken,
    expiresAt,
  );

  // GENERER LE REFRESH TOKEN FINAL AVEC LE token_id
  const refreshToken = jwt.sign(
    { ...payload, token_id: tokenId },
    process.env.REFRESH_SECRET!,
    {
      expiresIn: "7d",
    },
  );

  const cookieOptions = getCookieOptions();

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    accessToken,
    refreshToken,
    payload: { ...payload, token_id: tokenId },
  };
}
