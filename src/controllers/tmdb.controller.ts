import type { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

export async function proxyTMDB(req: Request, res: Response) {
  try {
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
  } catch (error) {
    console.error("TMDB Proxy Error:", error);
    return res.status(500).json({ message: "Erreur lors de l'appel à TMDB" });
  }
}
