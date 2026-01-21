import z from "zod";
import bcrypt from "bcryptjs";
import { checkUserExists, signUpModel } from "../models/user.model.js";
import { handleErrors } from "../utils/handle-errors.js";
import type { Request, Response } from "express";

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

    await signUpModel({
      username,
      email,
      hashedPassword,
      role: "user",
    });

    return res.status(201).json({
      success: "Utilisateur créé avec succès. Veuillez vous connecter",
    });
  } catch (err) {
    return handleErrors(err, res);
  }
}
