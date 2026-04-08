import z from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1),
});

export const usernameSchema = z.object({
  username: z.string().trim().min(1),
});

export const locationSchema = z.object({
  location: z.string().trim(),
});

export const descriptionSchema = z.object({
  description: z.string().trim().max(140, "La description ne doit pas dépasser 140 caractères"),
});

export const passwordSchema = z
  .object({
    currentPassword: z
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
    newPassword: z
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
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type UsernameInput = z.infer<typeof usernameSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type DescriptionInput = z.infer<typeof descriptionSchema>;
