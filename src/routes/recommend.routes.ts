import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { createUserActivityLog, trainModelAndRecommend } from '../controllers/recommend.controller';
const router = Router();

router.post('/user-activity-log', verifyToken, createUserActivityLog);

router.post('/train-and-recommend', trainModelAndRecommend);

export default router;