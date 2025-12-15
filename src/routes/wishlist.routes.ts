import { Router } from 'express';
import { createWishlist, getWishlist, deleteWishlistItem } from '../controllers/wishlist.contoller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

router.post('/create', verifyToken, createWishlist);

router.get('/get', verifyToken, getWishlist);

router.delete('/delete', verifyToken, deleteWishlistItem);

export default router;