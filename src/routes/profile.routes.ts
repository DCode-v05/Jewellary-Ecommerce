import { Router } from 'express';
import { createAddress, getProfile, updateProfile, updateSubscription, updatePassword, createContactMe, deleteAddressById, updateAddress } from '../controllers/profile.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/handleMulter';
const router = Router();

router.post('/address/create', verifyToken, createAddress);

router.put('/address/update', verifyToken, updateAddress);

router.delete('/address/delete', verifyToken, deleteAddressById);

router.get('/get', verifyToken, getProfile);

router.put('/update', verifyToken, upload.single('profileImage'), updateProfile);

router.put('/update/password', verifyToken, updatePassword);

router.put('/update/subscription', verifyToken, updateSubscription);

router.post('/contact', createContactMe);

export default router;