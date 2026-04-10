import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { storeRefreshTokenIdModel } from "../models/auth.model.js";

import type { UserPayload, SessionUser } from "../types/db.js";

// COOKIE OPTIONS CENTRALISEES
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  } as const;
}

// PAYLOAD UNIQUE POUR TOUTE L'APP
export function generateUserPayload(user: SessionUser): UserPayload {
  return {
    id: String(user.id || user.user_id),
    username: user.username,
    email: user.email,
    role: user.role,
    top_list_id: user.top_list_id ?? null,
    watchlist_id: user.watchlist_id ?? null,
    avatar_path: user.avatar_path ?? null,
    banner_path: user.banner_path ?? null,
    location: user.location,
    description: user.description,
  };
}

// Crée accessToken + refreshToken (pour le login)
export async function createTokensAndSetCookies(
  res: Response,
  user: SessionUser,
) {
  // creation du payload utilisateur
  const payload = generateUserPayload(user);

  // creation de l'access token
  const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET!, {
    expiresIn: "10s",
  });

  // creation UUID et expiration du token et stockage en base
  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await storeRefreshTokenIdModel(payload.id, tokenId, expiresAt);

  // creation du refresh token
  const refreshToken = jwt.sign(
    { ...payload, token_id: tokenId },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" },
  );

  // envoi des cookies
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

// Rafraîchit seulement l'accessToken (garde le même refreshToken)
export async function refreshAccessTokenOnly(
  req: Request,
  res: Response,
  user: UserPayload,
) {
  // on retire exp et iat du payload
  const { exp, iat, ...payloadWithoutExp } = user;

  // creation du nouvel access token
  const accessToken = jwt.sign(payloadWithoutExp, process.env.ACCESS_SECRET!, {
    expiresIn: "10s",
  });

  const cookieOptions = getCookieOptions();
  res.cookie("accessToken", accessToken, cookieOptions);

  return { accessToken };
}

// Met à jour les tokens avec de nouvelles données (pour changement de profil)
export async function updateTokensAndSetCookies(
  req: Request,
  res: Response,
  user: UserPayload,
) {
  // on retire exp et iat du payload
  const { exp, iat, ...payloadWithoutExp } = user;

  // creation du nouvel access token
  const accessToken = jwt.sign(payloadWithoutExp, process.env.ACCESS_SECRET!, {
    expiresIn: "10s",
  });

  // creation du nouveau refresh token
  const refreshToken = jwt.sign(
    { ...payloadWithoutExp, token_id: user.token_id },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" },
  );

  const cookieOptions = getCookieOptions();
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken, payload: user };
}
