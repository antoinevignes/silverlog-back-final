import z from "zod";

const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const userMovieParamSchema = z.object({
  movie_id: z.coerce.number(),
});

export const seenMovieSchema = z.object({
  date: z.string().optional(),
  title: z.string(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  genres: z.array(genreSchema).nullable(),
});

export const ratingMovieSchema = z.object({
  rating: z.coerce.number().min(0).max(10),
  title: z.string(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  genres: z.array(genreSchema).nullable(),
});

export type UserMovieParamInput = z.infer<typeof userMovieParamSchema>;
export type SeenMovieInput = z.infer<typeof seenMovieSchema>;
export type RatingMovieInput = z.infer<typeof ratingMovieSchema>;
