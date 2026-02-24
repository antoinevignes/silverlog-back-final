import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

export async function proxyTMDB(req: Request, res: Response) {
  let endpoint = req.params.splat;

  if (Array.isArray(endpoint)) {
    endpoint = endpoint.join("/");
  }

  const queryParams = new URLSearchParams(req.query as any).toString();

  const url = `${process.env.TMDB_URL}/${endpoint}?${queryParams}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  });

  const data = await response.json();

  return res.status(response.status).json(data);
}
