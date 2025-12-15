import { Router } from 'express';
import { createCart, getCart, updateCart, deleteCartByCartItem } from '../controllers/cart.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

router.post('/create', verifyToken, createCart);

router.get('/get', verifyToken, getCart);

router.put('/update', verifyToken, updateCart);

router.delete('/delete', verifyToken, deleteCartByCartItem);

export default router;
