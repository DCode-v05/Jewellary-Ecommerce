import { Router } from 'express';
import { createCoupon, getAllCoupons, updateCoupon, deleteCouponByName, validateCoupon } from '../controllers/coupon.controller';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware';
const router = Router();

router.post('/create', verifyToken, authorizeRoles("ADMIN"), createCoupon);

router.get('/get', getAllCoupons);

router.put('/update', verifyToken, authorizeRoles("ADMIN"), updateCoupon);

router.delete('/delete', verifyToken, authorizeRoles("ADMIN"), deleteCouponByName);

router.post('/validate', verifyToken, validateCoupon);

export default router;