# Everest Textile Mills ERP - Backend Server

Node.js + Express + Prisma + PostgreSQL backend for the textile manufacturing ERP system.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ database
- Git

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/everest_textile_erp?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with initial data
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with initial data

## Default Login Credentials

After seeding the database, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@everesttextile.com | Admin@123 |
| Store Keeper | store@everesttextile.com | Admin@123 |
| Supervisor | supervisor@everesttextile.com | Admin@123 |
| Inspector | inspector@everesttextile.com | Admin@123 |
| Accountant | accounts@everesttextile.com | Admin@123 |

**⚠️ Change these passwords before production deployment!**

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seeding script
├── src/
│   ├── config/
│   │   └── database.js    # Database configuration
│   ├── controllers/       # Request handlers
│   ├── middleware/
│   │   ├── auth.js        # Authentication middleware
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/
│   │   ├── response.js    # Response helpers
│   │   ├── jwt.js         # JWT utilities
│   │   ├── password.js    # Password hashing
│   │   └── qrcode.js      # QR code generation
│   └── index.js           # Server entry point
├── .env                   # Environment variables
├── .env.example          # Environment template
├── package.json
└── README.md
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Health Check

```
GET /health
```

### Authentication Endpoints

(To be implemented in next tasks)

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/change-password
```

## Database Schema

The system includes 28+ tables organized into modules:

- **Identity & Access**: users, roles
- **Inventory**: suppliers, yarn_types, stock_batches, gate_entries, stock_movements, purchase_orders
- **Orders**: buyers, fabric_types, orders, order_status_history
- **Production**: machines, work_assignments, production_logs, downtime_logs
- **Quality**: fabric_rolls, inspections, defects
- **Dispatch**: dispatches, dispatch_items, invoices, payments
- **HR**: workers, shifts, attendance, wage_records
- **Finance**: expenses, settings

## Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5
- **Authentication**: JWT
- **Password Hashing**: argon2
- **QR Code**: qrcode
- **Validation**: express-validator, zod

## Development Guidelines

1. **Error Handling**: Use async/await with try-catch blocks
2. **Responses**: Use standardized response helpers from `utils/response.js`
3. **Authentication**: Protect routes using `authenticate` and `authorize` middleware
4. **Validation**: Validate all inputs using express-validator or Zod
5. **Database**: Use Prisma Client for all database operations
6. **Logging**: Log errors and important events

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres

# Test connection string
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected!')).catch(console.error);"
```

### Prisma Issues

```bash
# Reset database (⚠️ Deletes all data)
npx prisma migrate reset

# Regenerate Prisma Client
npx prisma generate
```

## Next Steps

1. ✅ Project structure set up
2. ✅ Database schema designed
3. ⏳ Implement authentication API
4. ⏳ Implement inventory management API
5. ⏳ Implement production management API
6. ⏳ Implement quality control API
7. ⏳ Implement dispatch and invoicing API
8. ⏳ Implement HR and attendance API
9. ⏳ Implement finance and reporting API

## Support

For issues or questions, refer to the main project README.
