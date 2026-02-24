import z from "zod";
import bcrypt from "bcryptjs";
import {
  checkUserExists,
  checkUserVerification,
  deleteRefreshTokenModel,
  signInModel,
  signUpModel,
  storeRefreshTokenModel,
  verifyEmailModel,
} from "../models/user.model.js";
import type { Request, Response } from "express";
import { Resend } from "resend";
import generateEmail from "../utils/generate-email.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const tokenSchema = z.string().trim();

const registerSchema = z.object({
  username: z.string().trim().min(1, "Nom d'utilisateur requis"),
  email: z.email("Email requis"),
  password: z
    .string()
    .trim()
    .min(12, "Mot de passe trop court")
    .max(128, "Mot de passe trop long")
    .regex(/[A-Z]/, "Doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Doit contenir au moins une minuscule")
    .regex(/\d/, "Doit contenir au moins un chiffre")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/,
      "Doit contenir un caractère spécial",
    )
    .refine((val) => !/\s/.test(val), "Ne doit pas contenir d'espace"),
});

const loginSchema = z.object({
  email: z.email("Email requis"),
  password: z.string().trim().min(1, "Mot de passe requis"),
});

// REGISTER
export async function signUp(req: Request, res: Response) {
  const parsed = registerSchema.parse(req.body);

  const { username, email, password } = parsed;

  const exists = await checkUserExists(email, username);
  if (exists.emailExists || exists.usernameExists)
    throw new Error("Email ou nom d'utilisateur déjà utilisé");

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = await bcrypt.hash(email, 10);
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
  const parsed = tokenSchema.safeParse(req.query.token);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Token manquant",
    });
  }

  const token = parsed.data;

  const user = await checkUserVerification(token);

  if (!user) {
    return res.status(400).json({ success: false, message: "Token invalide" });
  }

  if (user.email_verified) {
    return res
      .status(400)
      .json({ success: false, message: "Email déjà vérifié" });
  }

  if (new Date(user.token_expires_at) < new Date()) {
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

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw new Error("Email ou mot de passe invalide");

  if (!user.verified)
    throw new Error(
      "Email non-verifié. Veuillez valider votre compte avant de vous connecter.",
    );

  const accessToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      top_list_id: user.top_list_id,
      watchlist_id: user.watchlist_id,
    },
    process.env.ACCESS_SECRET!,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      top_list_id: user.top_list_id,
      watchlist_id: user.watchlist_id,
    },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" },
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await storeRefreshTokenModel(user.id, refreshToken, expiresAt);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    top_list_id: user.top_list_id,
    watchlist_id: user.watchlist_id,
  });
}

// SIGNOUT
export async function signOut(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await deleteRefreshTokenModel(refreshToken);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({ success: true });
}
