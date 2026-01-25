import { Router } from "express";
import userRoute from "./user.route.js";
import tmdbRoute from "./tmdb.route.js";

const router = Router();

router.use("/user", userRoute);
router.use("/tmdb", tmdbRoute);

export default router;
