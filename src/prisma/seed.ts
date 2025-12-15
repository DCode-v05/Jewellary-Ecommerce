import { prisma } from "../utils/prisma"; // Assuming your prisma client is exported here
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Categories
  await prisma.category.createMany({
    data: [
      { name: "Earrings", slug: "earrings" },
      { name: "Necklaces", slug: "necklaces" },
    ],
    skipDuplicates: true, // Prevent error if already inserted
  });

  // Fetch categories
  const categoryEarrings = await prisma.category.findFirst({
    where: { slug: "earrings" },
  });
  const categoryNecklaces = await prisma.category.findFirst({
    where: { slug: "necklaces" },
  });

  if (!categoryEarrings || !categoryNecklaces) {
    throw new Error("Categories not found!");
  }

  // Seed Products
  await prisma.product.createMany({
    data: [
      {
        name: "Golden Hoop Earrings",
        slug: "golden-hoop-earrings",
        price: 49.99,
        stock: 100,
        categoryId: categoryEarrings.id,
        metalType: "Gold",
        size: 2.5
      },
      {
        name: "Pearl Drop Necklace",
        slug: "pearl-drop-necklace",
        price: 79.99,
        stock: 50,
        categoryId: categoryNecklaces.id,
        metalType: "Silver",
        size: 1.5
      },
    ],
    skipDuplicates: true,
  });

  // Fetch products
  const goldenHoop = await prisma.product.findFirst({
    where: { slug: "golden-hoop-earrings" },
  });
  const pearlNecklace = await prisma.product.findFirst({
    where: { slug: "pearl-drop-necklace" },
  });

  if (!goldenHoop || !pearlNecklace) {
    throw new Error("Products not found!");
  }

  // Seed Product Images
  await prisma.productImage.create({
    data: {
      productId: goldenHoop.id,
      imageUrl: "https://example.com/earrings.jpg",
      altText: "Golden Hoop Earrings",
    },
  });

  await prisma.productImage.create({
    data: {
      productId: pearlNecklace.id,
      imageUrl: "https://example.com/necklace.jpg",
      altText: "Pearl Drop Necklace",
    },
  });

  // Seed Admin User
  const adminPassword = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: { email: "admin@wymi.in" },
    update: {}, // No update logic for now
    create: {
      name: "Admin User",
      email: "admin@wymi.in",
      passwordHash: adminPassword,
      role: "ADMIN",
      isEmailVerified: true,
      isSmsVerified: true,
      phone: "9677388522",
    },
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
