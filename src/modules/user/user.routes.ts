import express from 'express';
import { ChangePassword, ForgotPasswordLink, getAllUsers, getLeaderBoard, getSummary, LogInUser, SignUpUser, updateActive, VerifyUser } from './user.controller';
import { authCheck, verifyAdmin } from '../../middlewares/auth.middleware';

const userRouter = express.Router();

userRouter.post("/signup", SignUpUser);
userRouter.get("/verify", VerifyUser);
userRouter.post("/login", LogInUser);
userRouter.post("/forgot-password", ForgotPasswordLink);
userRouter.post("/change-password", ChangePassword);
userRouter.get("/summary", authCheck, getSummary);
userRouter.get("/leaderboard", authCheck, getLeaderBoard);
userRouter.get("/all", authCheck, getAllUsers);
userRouter.post("/active", authCheck, verifyAdmin, updateActive);

export default userRouter;