import express from 'express';
import { addTags, getAllTags } from './tags.controller';
import { authCheck } from '../../middlewares/auth.middleware';

const tagsRouter = express.Router();

tagsRouter.get("/", authCheck, getAllTags);
tagsRouter.post("/", authCheck, addTags);

export default tagsRouter;