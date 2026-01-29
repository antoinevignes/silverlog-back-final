import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { getRefreshTokenModel } from "../models/user.model.js";

dotenv.config();

interface UserPayload extends JwtPayload {
  id: string;
  username: string;
  email: string;
  role?: string;
  top_list_id?: number;
  watchlist_id?: number;
}

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

    const tokenInDB = await getRefreshTokenModel(refreshToken);
    if (!tokenInDB) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({ error: "Session révoquée" });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET!,
    ) as UserPayload;

    const newAccessToken = jwt.sign(
      {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        top_list_id: decoded.top_list_id,
        watchlist_id: decoded.watchlist_id,
      },
      process.env.ACCESS_SECRET!,
      { expiresIn: "15m" },
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    req.user = decoded;
    next();
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
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
