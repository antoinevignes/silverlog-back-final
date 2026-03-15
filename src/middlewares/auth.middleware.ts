import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  getUserRefreshTokensModel,
  deleteRefreshTokenByIdModel,
} from "../models/auth.model.js";
import type { UserPayload } from "../types/db.js";
import bcrypt from "bcryptjs";
import { regenerateTokensAndSetCookies } from "../utils/auth.js";

dotenv.config();

declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

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

    const tokensInDB = await getUserRefreshTokensModel(decoded.id);
    let validToken = null;
    for (const t of tokensInDB) {
      if (await bcrypt.compare(refreshToken, t.token)) {
        validToken = t;
        break;
      }
    }

    if (!validToken) {
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      } as const;
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      return res.status(401).json({ error: "Session révoquée" });
    }

    const { payload } = await regenerateTokensAndSetCookies(req, res, decoded);

    req.user = payload as UserPayload;
    next();
  } catch (error) {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    } as const;
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.status(401).json({
      error: "Session expirée, veuillez vous reconnecter",
    });
  }
}

// export const requireRole = (...allowedRoles) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       return res.status(401).json({ error: "Non authentifié" });
//     }

//     if (!allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         error: "Accès interdit",
//       });
//     }

//     next();
//   };
// };
