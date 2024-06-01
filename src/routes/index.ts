import problemsRouter from '../modules/problems/problems.routes';
import submissionsRouter from '../modules/submissions/submission.routes';
import tagsRouter from '../modules/tags/tags.routes';
import testCaseRouter from '../modules/testcases/testcases.routes';
import userRouter from '../modules/user/user.routes';
import { Router } from 'express';

const apiRoutes = Router();


apiRoutes.use('/user', userRouter);
apiRoutes.use('/tags', tagsRouter);
apiRoutes.use('/problems', problemsRouter);
apiRoutes.use('/test-case', testCaseRouter);
apiRoutes.use('/submissions', submissionsRouter);


export default apiRoutes;
