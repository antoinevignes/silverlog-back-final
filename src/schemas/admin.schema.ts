import z from "zod";

export const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export const deleteReviewParamsSchema = z.object({
  reviewId: z.coerce.number(),
});

export const userIdParamsSchema = z.object({
  userId: z.coerce.number(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type DeleteReviewParamsInput = z.infer<typeof deleteReviewParamsSchema>;
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>;
