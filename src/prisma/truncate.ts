// prisma/truncate.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function truncate() {
  console.log('🧹 Truncating all tables...');
  
  await prisma.$executeRawUnsafe(`TRUNCATE 
    "UserActivityLog",
    "WishlistItem",
    "Wishlist",
    "CartItem",
    "Cart",
    "Review",
    "OrderItem",
    "Order",
    "ProductImage",
    "ProductVariant",
    "Product",
    "Coupon",
    "Category",
    "Address",
    "User"
    RESTART IDENTITY CASCADE;
  `);

  console.log('✅ All tables truncated!');
}

truncate()
  .catch((e) => {
    console.error('❌ Error truncating tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
