import { Router } from 'express';
import { createCategory, getAllCategories, updateCategory, deleteCategoryByName, createBlogPost, updateBlogPost, deleteBlogPost, createUser, updateUser, deleteUser, getContactMessages } from '../controllers/admin.controller';
import { createProduct, getAllProducts, updateProduct, deleteProductByName } from '../controllers/admin.controller';
import { deleteReview, getReviews } from '../controllers/admin.controller';
import { getAllUser  } from '../controllers/admin.controller';
import { updateOrderStatus } from '../controllers/admin.controller';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/handleMulter';
const router = Router();

router.post('/products/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([  { name: 'bannerImage', maxCount: 1 }, { name: 'productImages', maxCount: 10 }, { name: 'variantImages', maxCount: 10 }, ]), createProduct);

router.get('/products/get', getAllProducts);

router.put('/products/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([  { name: 'bannerImage', maxCount: 1 }, { name: 'productImages', maxCount: 10 }, { name: 'variantImages', maxCount: 10 }, ]), updateProduct);

router.delete('/products/delete', deleteProductByName);

router.post('/categories/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([{ name: 'categoryImage', maxCount: 1 }]), createCategory);

router.get('/categories/get', getAllCategories);

router.put('/categories/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([{ name: 'categoryImage', maxCount: 1 }]), updateCategory);

router.delete('/categories/delete', verifyToken, authorizeRoles("ADMIN"), deleteCategoryByName);

router.get('/reviews/get', verifyToken, authorizeRoles("ADMIN"), getReviews);

router.delete('/reviews/delete', verifyToken, authorizeRoles("ADMIN"), deleteReview);

router.post('/blogs/create', verifyToken, authorizeRoles("ADMIN"), upload.single('coverImage'), createBlogPost);

router.put('/blogs/update', verifyToken, authorizeRoles("ADMIN"), upload.single('coverImage'), updateBlogPost);

router.delete('/blogs/delete', verifyToken, authorizeRoles("ADMIN"), deleteBlogPost);

router.post('/users/create', verifyToken, authorizeRoles("ADMIN"), createUser);

router.get('/users/get', verifyToken, authorizeRoles("ADMIN"), getAllUser);

router.put('/users/update', verifyToken, authorizeRoles("ADMIN"), upload.single('profileImage'), updateUser);

router.delete('/users/delete', verifyToken, authorizeRoles("ADMIN"), deleteUser);

router.put('/orders/update-status', verifyToken, authorizeRoles("ADMIN"), updateOrderStatus);

router.get('/contact-messages/get', verifyToken, authorizeRoles("ADMIN"), getContactMessages);

export default router;