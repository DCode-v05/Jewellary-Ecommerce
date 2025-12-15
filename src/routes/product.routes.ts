import { Router } from 'express';
import { productDetailsBySlug } from '../controllers/product.controller';
const router = Router();

router.get('/details/:slug', productDetailsBySlug);

export default router;