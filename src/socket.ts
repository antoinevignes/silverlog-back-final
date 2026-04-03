import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import type { UserPayload } from "./types/db.js";

let io: Server;

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "https://silverlog.tech",
        "https://www.silverlog.tech",
        "http://localhost:3000",
      ],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error("Authentication required"));
      }

      const cookies = cookie.parse(cookieHeader);
      const accessToken = cookies.accessToken;
      if (!accessToken) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_SECRET!,
      ) as UserPayload;

      (socket as any).userId = decoded.id;
      next();
    } catch {
      next(new Error("Authentication required"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
