import { Router } from "express";
import { signUp } from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.post("/sign-up", signUp);

export default userRoute;
