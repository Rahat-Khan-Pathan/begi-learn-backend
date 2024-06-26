import express from 'express';
import { addProblem, deleteProblem, getAllProblems, getProblemById, getProblemByIdForUpdate, updateProblem, updateVerification } from './problems.controller';
import { authCheck, verifyAdmin } from '../../middlewares/auth.middleware';

const problemsRouter = express.Router();

problemsRouter.post("/", authCheck, addProblem);
problemsRouter.get("/", authCheck, getAllProblems);
problemsRouter.get("/:id", authCheck, getProblemById);
problemsRouter.get("/for-update/:id", authCheck, getProblemByIdForUpdate);
problemsRouter.put("/:id", authCheck, updateProblem);
problemsRouter.delete("/:id", authCheck, verifyAdmin, deleteProblem);
problemsRouter.post("/verify", authCheck, verifyAdmin, updateVerification);

export default problemsRouter;