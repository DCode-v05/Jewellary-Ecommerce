import { Router } from 'express';
import {
  getHeroBanner,
  getRecommendedProducts,
  getNewArrivals,
  getBestSellers,
  getMostViewed,
  getDiscountedProducts,
  getTestimonials,
  subscribeEmail,
  getBlogPosts
} from './../controllers/home.controller';
const router = Router();

router.get('/hero-banner', getHeroBanner);

router.get('/recommended-products', getRecommendedProducts);

router.get('/new-arrivals', getNewArrivals);

router.get('/best-sellers', getBestSellers);

router.get('/most-viewed', getMostViewed);

router.get('/discounted-products', getDiscountedProducts);

router.get('/testimonials', getTestimonials);

router.post('/subscribe', subscribeEmail);

router.get('/blog-posts', getBlogPosts);

export default router;