import z from "zod";
import bcrypt from "bcryptjs";
import {
  checkUserExists,
  checkUserVerification,
  deleteRefreshTokenByIdModel,
  signInModel,
  signUpModel,
  verifyEmailModel,
} from "../models/auth.model.js";
import type { UserPayload } from "../types/db.js";
import type { Request, Response } from "express";
import { Resend } from "resend";
import generateEmail from "../utils/generate-email.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { regenerateTokensAndSetCookies } from "../utils/auth.js";
import { getCookieOptions } from "../utils/handle-errors.js";

dotenv.config();

const registerSchema = z.object({
  username: z.string().trim().min(3),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

// REGISTER
export async function signUp(req: Request, res: Response) {
  const parsed = registerSchema.parse(req.body);

  const { username, email, password } = parsed;

  const exists = await checkUserExists(email, username);
  if (exists.emailExists || exists.usernameExists)
    throw new Error("Email ou nom d'utilisateur déjà utilisé");

  const hashedPassword = await bcrypt.hash(password, 12);
  const verificationToken = await bcrypt.hash(email, 12);
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await signUpModel({
    username,
    email,
    hashedPassword,
    role: "user",
    verificationToken,
    tokenExpiresAt,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Silverlog <onboarding@resend.dev>",
    to: [email],
    subject: "Silverlog - Activer votre compte",
    html: generateEmail(verificationToken),
  });

  return res.status(201).json({
    success:
      "Utilisateur créé avec succès. Un lien de verification vous a été envoyé par email.",
  });
}

// VERIFIER EMAIL
export async function verifyEmail(req: Request, res: Response) {
  const parsed = z.string().parse(req.query.token);

  const token = parsed;

  const user = await checkUserVerification(token);

  if (!user) {
    return res.status(400).json({ success: false, message: "Token invalide" });
  }

  if (user.verified) {
    return res
      .status(400)
      .json({ success: false, message: "Email déjà vérifié" });
  }

  if (!user.token_expires_at || new Date(user.token_expires_at) < new Date()) {
    return res.status(400).json({ success: false, message: "Token expiré" });
  }

  await verifyEmailModel(user.id);

  return res
    .status(200)
    .json({ success: true, message: "Email vérifié avec succès !" });
}

// LOGIN
export async function signIn(req: Request, res: Response) {
  const parsed = loginSchema.parse(req.body);
  const { email, password } = parsed;

  const user = await signInModel(email);
  if (!user) throw new Error("Email ou mot de passe invalide");

  if (!user.password) throw new Error("Email ou mot de passe invalide");

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new Error("Email ou mot de passe invalide");

  if (!user.verified)
    throw new Error(
      "Email non-verifié. Veuillez valider votre compte avant de vous connecter.",
    );

  const { payload } = await regenerateTokensAndSetCookies(req, res, user);

  return res.status(200).json(payload);
}

// SIGNOUT
export async function signOut(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.decode(refreshToken) as UserPayload | null;
      if (decoded?.token_id) {
        await deleteRefreshTokenByIdModel(decoded.token_id);
      }
    } catch (err) {
      console.error("Erreur lors de la suppression du refresh token:", err);
    }
  }

  const options = getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  return res.status(200).json({ success: true });
}
