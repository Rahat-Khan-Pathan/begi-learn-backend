import express from 'express';
import { addSubmission, getAllSubmissions, getMySubmissions, getSubmissionById, runSample } from './submission.controller';
import { authCheck } from '../../middlewares/auth.middleware';

const submissionsRouter = express.Router();

submissionsRouter.post("/submit", authCheck, addSubmission);
submissionsRouter.post("/run", authCheck, runSample);
submissionsRouter.get("/all", authCheck, getAllSubmissions);
submissionsRouter.get("/all/:id", authCheck, getMySubmissions);
submissionsRouter.get("/one/:id", authCheck, getSubmissionById);

export default submissionsRouter;