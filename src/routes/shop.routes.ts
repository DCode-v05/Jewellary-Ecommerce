import { Router } from 'express';
import { getShopAllProducts, getShopBestSellers, getShopMostViewed, getShopRecommedations, getAllCategories, getAllMetalTypes, getAllTags } from '../controllers/shop.controller';

const router = Router();

router.get('/all-products', getShopAllProducts);

router.get('/best-sellers', getShopBestSellers);

router.get('/most-viewed', getShopMostViewed);

router.get('/recommended', getShopRecommedations);

router.get('/categories', getAllCategories);

router.get('/metal-types', getAllMetalTypes);

router.get('/tags', getAllTags);

export default router;
