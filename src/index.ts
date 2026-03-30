import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import router from "./routes/index.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./utils/handle-errors.js";
import { initSocket } from "./socket.js";

dotenv.config();
const { PORT } = process.env;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://silverlog-front.onrender.com", "http://localhost:3000"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(router);
app.use(errorHandler);

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT || 8000, () =>
  console.log(`Listening on http://localhost:${PORT}`),
);
