import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getRefreshTokenIdModel } from "../models/auth.model.js";
import type { UserPayload } from "../types/db.js";
import { getCookieOptions, refreshAccessTokenOnly } from "../utils/auth.js";

dotenv.config();

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

// MIDDLEWARE AUTHENTIFICATION
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // recuperation du token
    const accessToken = req.cookies.accessToken;

    // si pas de token, erreur d'authentification
    if (!accessToken) {
      return res.status(401).json({ error: "Erreur d'authentification" });
    }

    // verification du token
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET!,
    ) as UserPayload;

    req.user = decoded;
    next();
  } catch (error: any) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      // si le token est expiré ou invalide, on essaie de le rafraichir
      return refreshAccessToken(req, res, next);
    } else {
      // sinon erreur d'authentification
      res.status(401).json({ error: "Erreur d'authentification" });
    }
  }
}

// MIDDLEWARE ADMIN
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ error: "Accès refusé. Droits administrateur requis." });
  }
}

// Middelware authentification optionnelle
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // recuperation des tokens
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken) {
    // si pas de access token, on essaie de le rafraichir
    if (refreshToken) {
      return refreshAccessToken(req, res, next);
    }

    req.user = null!;
    return next();
  }

  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_SECRET!,
    ) as UserPayload;

    req.user = decoded;
    next();
  } catch (error: any) {
    // si le token est expiré ou invalide, on essaie de le rafraichir
    if (
      (error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError") &&
      refreshToken
    ) {
      return refreshAccessToken(req, res, next);
    }

    req.user = null!;
    next();
  }
}

// RAFRAICHIR LE TOKEN
async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies.refreshToken;

    // si pas de refresh token, erreur d'authentification
    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token manquant" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!,
    ) as UserPayload;

    let validToken = null;

    // verification du refresh token (comparaison avec token_id en base)
    if (decoded.token_id) {
      const dbToken = await getRefreshTokenIdModel(decoded.token_id);
      if (dbToken && dbToken.token_id === decoded.token_id) {
        validToken = dbToken;
      }
    }

    // si pas de refresh token valide, erreur d'authentification, deconnexion
    if (!validToken) {
      const options = getCookieOptions();
      res.clearCookie("accessToken", options);
      res.clearCookie("refreshToken", options);
      return res.status(401).json({ error: "Session révoquée" });
    }

    await refreshAccessTokenOnly(req, res, decoded);

    req.user = decoded;
    next();
  } catch (error) {
    // si erreur, deconnexion
    const options = getCookieOptions();
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    res.status(401).json({
      error: "Session expirée, veuillez vous reconnecter",
    });
  }
}
