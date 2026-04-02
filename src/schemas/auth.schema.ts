import z from "zod";

export const registerSchema = z.object({
  username: z.string().trim().min(3, "Vous devez donner un nom d'utilisateur"),
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
      new RegExp("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`]"),
      "Doit contenir un caractère spécial",
    )
    .refine((val) => !/\s/.test(val), "Ne doit pas contenir d'espace"),
});

export const loginSchema = z.object({
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
      new RegExp("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`]"),
      "Doit contenir un caractère spécial",
    )
    .refine((val) => !/\s/.test(val), "Ne doit pas contenir d'espace"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
