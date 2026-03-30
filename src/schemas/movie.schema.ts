import z from "zod";

const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const movieParamsSchema = z.object({
  movie_id: z.coerce.number(),
});

export const updateCrewPicksSchema = z.object({
  movie_ids: z.array(z.coerce.number()),
});

export type MovieParamsInput = z.infer<typeof movieParamsSchema>;
export type UpdateCrewPicksInput = z.infer<typeof updateCrewPicksSchema>;
