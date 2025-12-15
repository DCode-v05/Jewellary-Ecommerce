import { Router } from 'express';
import { createReview, getReviewsByUserId, getReviewsByProductId, updateReview, deleteReview } from '../controllers/review.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/handleMulter';
const router = Router();

router.post('/create', upload.array('media', 10), verifyToken, createReview);

router.get('/user/get', verifyToken, getReviewsByUserId);

router.get('/product/get/:id', getReviewsByProductId);

router.put('/update', upload.array('media', 10), verifyToken, updateReview);

router.delete('/delete', verifyToken, deleteReview);

export default router;