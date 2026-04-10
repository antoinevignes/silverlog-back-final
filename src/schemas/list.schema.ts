import z from "zod";

const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const listSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().nullable(),
  is_public: z.boolean("La liste doit être publique ou privée"),
});

export const listParamsSchema = z.object({
  list_id: z.coerce.number(),
});

export const toggleMovieSchema = z.object({
  movie_id: z.coerce.number(),
  title: z.string(),
  release_date: z.string().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  genres: z.array(genreSchema).nullable(),
});

export const listUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
});

export const listReorderSchema = z.object({
  movie_ids: z.array(z.coerce.number()),
});

export const listAndMovieParamsSchema = z.object({
  list_id: z.coerce.number(),
  movie_id: z.coerce.number(),
});

export type ListInput = z.infer<typeof listSchema>;
export type ListParamsInput = z.infer<typeof listParamsSchema>;
export type ToggleMovieInput = z.infer<typeof toggleMovieSchema>;
export type ListUpdateInput = z.infer<typeof listUpdateSchema>;
export type ListReorderInput = z.infer<typeof listReorderSchema>;
export type ListAndMovieParamsInput = z.infer<typeof listAndMovieParamsSchema>;
