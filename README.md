# Jewellery Ecommerce API (wymi-api)

## Project Description
This project is a comprehensive RESTful API designed for a Jewellery E-commerce platform. Built with Node.js and TypeScript, it provides a robust backend solution for managing users, products, orders, and payments. The system leverages PostgreSQL for data persistence and integrates with various third-party services for a seamless e-commerce experience.

---

## Project Details

### Key Features
- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control (Admin, User) and CSRF protection.
- **Product Management**: valid support for categories, product variants (size, weight, metal type), and image management via AWS S3.
- **Shopping Experience**: Full cart and wishlist functionality, product reviews, and ratings.
- **Order Processing**: Complete order lifecycle management (Ordered -> Delivered/Cancelled), invoice generation, and GST calculation.
- **Marketing**: Coupon management system and recommendation engine.
- **Integrations**:
  - **Payments**: Razorpay integration for secure transactions.
  - **Shipping**: ShipRocket integration for logistics.
  - **Notifications**: Twilio (SMS) and SendGrid (Email) support.

### Database Design
The project uses **Prisma ORM** with **PostgreSQL**. The schema includes models for:
- Users & Profiles (including Addresses)
- Products, Categories, & Variants
- Orders, OrderItems, & Invoices
- Carts & Wishlists
- Reviews & Media
- Coupons & User Activity Logs

### Security
- **Helmet**: Secures HTTP headers.
- **CORS**: Configured for frontend integration.
- **Rate Limiting**: Protects against brute-force attacks.
- **Input Validation**: Utilizes Zod for strict schema validation.

---

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Storage**: AWS S3
- **Documentation**: Swagger UI
- **Containerization**: Docker

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/DCode-v05/Jewellary-Ecommerce.git
cd Jewellary-Ecommerce
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`) and configure your environment variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
PORT=5000
JWT_SECRET="your_secret"
# ... add other keys for AWS, Razorpay, etc.
```

### 4. Database Setup
Run Prisma migrations to set up your database schema:
```bash
npx prisma migrate dev
```
To seed the database (if seed script is available):
```bash
npm run seed
```

### 5. Run the Application
**Development Mode:**
```bash
npm run dev
```
**Production Mode:**
```bash
npm run build
npm start
```
The server will start at `http://localhost:5000`. API Documentation is available at `http://localhost:5000/api-docs`.

---

## Usage
- **API Documentation**: Visit `/api-docs` to interact with the API endpoints using Swagger UI.
- **Authentication**: Register a user and login to receive a secure cookie/token for protected routes.
- **Admin**: Specific routes are protected for users with the `ADMIN` role.

---

## Project Structure
```
Jewellary-Ecommerce/
│
├── src/
│   ├── app.ts              # App entry point & configuration
│   ├── controllers/        # Route logic
│   ├── routes/             # API route definitions
│   ├── middlewares/        # Auth, error handling, etc.
│   ├── utils/              # Helper functions
│   ├── validators/         # Zod schemas
│   └── prisma/             # Seed/Truncate scripts
│
├── prisma/
│   └── schema.prisma       # Database schema definition
│
├── .env.example            # Environment variable template
├── docker-compose.yml      # Docker configuration
├── package.json            # Dependencies & Scripts
└── README.md               # Project documentation
```

---

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request describing your changes.

---

## Contact
- **GitHub**: [DCode-v05](https://github.com/DCode-v05)
- **Email**: denistanb05@gmail.com
