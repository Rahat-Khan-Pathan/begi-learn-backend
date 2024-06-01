import express from 'express';
import { addTestCase, deleteTestCase, getAllTestCases, getTestCaseById, getTestCaseByProblemId, updateTestCase } from './testcases.controller';
import { authCheck, verifyAdmin } from '../../middlewares/auth.middleware';

const testCaseRouter = express.Router();

testCaseRouter.post("/", authCheck, addTestCase);
testCaseRouter.get("/", authCheck, verifyAdmin, getAllTestCases);
testCaseRouter.get("/:id", authCheck, getTestCaseById);
testCaseRouter.get("/problem/:id", authCheck, getTestCaseByProblemId);
testCaseRouter.put("/:id", authCheck, updateTestCase);
testCaseRouter.delete("/:id", authCheck, deleteTestCase);

export default testCaseRouter;