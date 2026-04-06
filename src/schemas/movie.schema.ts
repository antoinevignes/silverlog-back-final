import z from "zod";

export const movieParamsSchema = z.object({
  movie_id: z.coerce.number(),
});

export const updateCrewPicksSchema = z.object({
  movies: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      poster_path: z.string().nullable().optional(),
      backdrop_path: z.string().nullable().optional(),
      release_date: z.string().nullable().optional(),
      genres: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
    }),
  ),
});

export type MovieParamsInput = z.infer<typeof movieParamsSchema>;
export type UpdateCrewPicksInput = z.infer<typeof updateCrewPicksSchema>;
