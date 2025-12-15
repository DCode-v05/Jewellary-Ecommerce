import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import csrfRoutes from './routes/csrf.routes';
import productRoutes from './routes/product.routes';
import adminRoutes from './routes/admin.routes';
import homeRoutes from './routes/home.routes';
import shopRoutes from './routes/shop.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import reviewRoutes from './routes/review.routes';
import profileRoutes from './routes/profile.routes';
import orderRoutes from './routes/order.routes';
import recommendationRoutes from './routes/recommend.routes';
import couponRoutes from './routes/coupon.routes';
import defaultRoutes from './routes/default.routes';
import shipRocketRoutes from './routes/shipRocket.routes';
import razorpayRoutes from './routes/razorpay.routes';
import { swaggerUi, specs } from './docs/swagger';

dotenv.config();

interface CustomError extends Error {
  status?: number;
}

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));


app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API Docs in JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api", csrfRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/recommend', recommendationRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/default', defaultRoutes);
app.use('/api/shiprocket', shipRocketRoutes);
app.use('/api/razorpay', razorpayRoutes);

app.use((err: CustomError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});