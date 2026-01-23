import { Router } from "express";
import { signUp, verifyEmail } from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.post("/sign-up", signUp);
userRoute.get("/verify-email", verifyEmail);

export default userRoute;
