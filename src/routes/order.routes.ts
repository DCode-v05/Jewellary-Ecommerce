import { Router } from 'express';
import { createOrder, getOrdersByUser, getOrderById, getOrderTracking, updateAddress, cancelOrder, makePaymentFailed } from '../controllers/order.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/handleMulter';
const router = Router();

router.post('/create', verifyToken, createOrder);

router.post('/payment-failed', verifyToken, makePaymentFailed);

router.get('/get', verifyToken, getOrdersByUser);

router.get('/get-by-id/:orderId', verifyToken, getOrderById);

router.get('/tracking', verifyToken, getOrderTracking);

router.put('/update-address', verifyToken, updateAddress);

router.delete('/cancel', verifyToken, upload.fields([ { name :'cancelVideo', maxCount: 1 } ]), cancelOrder);

export default router;