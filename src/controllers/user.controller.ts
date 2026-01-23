import z from "zod";
import bcrypt from "bcryptjs";
import {
  checkUserExists,
  checkUserVerification,
  signUpModel,
  verifyEmailModel,
} from "../models/user.model.js";
import { handleErrors } from "../utils/handle-errors.js";
import type { Request, Response } from "express";
import { Resend } from "resend";
import generateEmail from "../utils/generate-email.js";

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

// REGISTER
export async function signUp(req: Request, res: Response) {
  try {
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
  } catch (err) {
    return handleErrors(err, res);
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const parsed = tokenSchema.safeParse(req.query.token);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Token manquant",
    });
  }

  const token = parsed.data;

  try {
    const user = await checkUserVerification(token);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token invalide" });
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
  } catch (error) {
    console.error("Erreur vérification email:", error);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
    });
  }
}
