import z from "zod";

const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const reviewSchema = z.object({
  movie_id: z.coerce.number(),
  title: z.string().min(1),
  content: z.string().min(1),
  rating: z.coerce.number().min(0).max(10),
  has_spoilers: z.boolean().optional(),
  genres: z.array(genreSchema).optional(),
});

export const reviewMovieParamSchema = z.object({
  movie_id: z.coerce.number(),
});

export const reviewParamSchema = z.object({
  review_id: z.coerce.number(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewMovieParamInput = z.infer<typeof reviewMovieParamSchema>;
export type ReviewParamInput = z.infer<typeof reviewParamSchema>;
