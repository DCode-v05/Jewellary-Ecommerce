import { Router } from 'express';
import { authorizeRoles, verifyToken } from '../middlewares/auth.middleware';

import { createHeroBanner, getAllHeroBanners, updateHeroBanner, deleteHeroBanner } from '../controllers/default.controller';
import { createFlashSaleImage, getAllFlashSaleImages, updateFlashSaleImage, deleteFlashSaleImage } from '../controllers/default.controller';
import { createBannerImage, getAllBannerImages, updateBannerImage, deleteBannerImage } from '../controllers/default.controller';
import { createTrendingNowVideo, getAllTrendingNowVideos, updateTrendingNowVideo, deleteTrendingNowVideo } from '../controllers/default.controller';
import { createShopImage, getAllShopImages, updateShopImage, deleteShopImage } from '../controllers/default.controller';
import { upload } from '../middlewares/handleMulter';

const router = Router();

router.post('/hero-banner/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'bannerImage', maxCount: 1 } ]), createHeroBanner);

router.get('/hero-banner/get', getAllHeroBanners);

router.put('/hero-banner/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'bannerImage', maxCount: 1 } ]), updateHeroBanner);

router.delete('/hero-banner/delete', verifyToken, authorizeRoles("ADMIN"), deleteHeroBanner);

router.post('/flash-sale-image/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'flashSaleImage1', maxCount: 1 }, { name :'flashSaleImage2', maxCount: 1 }, { name :'flashSaleImage3', maxCount: 1 }, { name :'flashSaleImage4', maxCount: 1 } ]), createFlashSaleImage);

router.get('/flash-sale-image/get', getAllFlashSaleImages);

router.put('/flash-sale-image/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'flashSaleImage1', maxCount: 1 }, { name :'flashSaleImage2', maxCount: 1 }, { name :'flashSaleImage3', maxCount: 1 }, { name :'flashSaleImage4', maxCount: 1 } ]), updateFlashSaleImage);

router.delete('/flash-sale-image/delete', verifyToken, authorizeRoles("ADMIN"), deleteFlashSaleImage);

router.post('/banner-image/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'bannerImage', maxCount: 1 } ]), createBannerImage);

router.get('/banner-image/get', getAllBannerImages);

router.put('/banner-image/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'bannerImage', maxCount: 1 } ]), updateBannerImage);

router.delete('/banner-image/delete', verifyToken, authorizeRoles("ADMIN"), deleteBannerImage);

router.post('/trending-now-video/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'trendingNowVideo', maxCount: 1 } ]), createTrendingNowVideo);

router.get('/trending-now-video/get', getAllTrendingNowVideos);

router.put('/trending-now-video/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'trendingNowVideo', maxCount: 1 } ]), updateTrendingNowVideo);

router.delete('/trending-now-video/delete', verifyToken, authorizeRoles("ADMIN"), deleteTrendingNowVideo);

router.post('/shop-image/create', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'shopImage', maxCount: 1 } ]), createShopImage);

router.get('/shop-image/get', getAllShopImages);

router.put('/shop-image/update', verifyToken, authorizeRoles("ADMIN"), upload.fields([ { name :'shopImage', maxCount: 1 } ]), updateShopImage);

router.delete('/shop-image/delete', verifyToken, authorizeRoles("ADMIN"), deleteShopImage);

export default router;