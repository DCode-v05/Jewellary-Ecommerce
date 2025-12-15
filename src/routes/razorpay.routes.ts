import { Router } from 'express';
import { createRazorPayOrder, verifyRazorPayPayment, generateInvoice, getAllTransactions, refundPayment } from '../controllers/razorpay.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = Router();

router.post('/create-order', verifyToken, createRazorPayOrder);

router.post('/verify-payment', verifyToken, verifyRazorPayPayment);

router.post('/generate-invoice', verifyToken, generateInvoice);

router.get('/transactions', verifyToken, getAllTransactions);

router.post('/refund', verifyToken, refundPayment);

export default router;