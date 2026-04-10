import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

// PROXY TMDB
export async function proxyTMDB(req: Request, res: Response) {
  let endpoint = req.params.splat;

  if (Array.isArray(endpoint)) {
    endpoint = endpoint.join("/");
  }

  const queryString = Object.entries(req.query)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value
          .map(
            (v) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`,
          )
          .join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");

  const url = `${process.env.TMDB_URL}/${endpoint}?${queryString}`;

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  });

  const data = await response.json();

  return res.status(response.status).json(data);
}
