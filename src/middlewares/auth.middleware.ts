import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getRefreshTokenByIdModel } from "../models/auth.model.js";
import type { UserPayload } from "../types/db.js";
import { regenerateTokensAndSetCookies } from "../utils/auth.js";
import { getCookieOptions } from "../utils/handle-errors.js";

dotenv.config();

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

// Middelware authentification
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "Erreur d'authentification" });
    }
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
      return refreshAccessToken(req, res, next);
    } else {
      res.status(401).json({ error: "Erreur d'authentification" });
    }
  }
}

// Middelware admin
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
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken) {
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

// Rafraichir le token
async function refreshAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token manquant" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!,
    ) as UserPayload;

    let validToken = null;

    if (decoded.token_id) {
      const dbToken = await getRefreshTokenByIdModel(decoded.token_id);
      if (dbToken && dbToken.token === decoded.token_id) {
        validToken = dbToken;
      }
    }

    if (!validToken) {
      const options = getCookieOptions();
      res.clearCookie("accessToken", options);
      res.clearCookie("refreshToken", options);
      return res.status(401).json({ error: "Session révoquée" });
    }

    const { payload } = await regenerateTokensAndSetCookies(req, res, decoded);

    req.user = payload as UserPayload;
    next();
  } catch (error) {
    const options = getCookieOptions();
    res.clearCookie("accessToken", options);
    res.clearCookie("refreshToken", options);
    res.status(401).json({
      error: "Session expirée, veuillez vous reconnecter",
    });
  }
}
