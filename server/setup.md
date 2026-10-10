# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup PostgreSQL Database

Make sure PostgreSQL is installed and running. Create a database:

```sql
CREATE DATABASE everest_textile_erp;
```

## Step 3: Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/everest_textile_erp?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

## Step 4: Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

## Step 5: Start Development Server

```bash
npm run dev
```

Server will be running at `http://localhost:5000`

## Step 6: Test Authentication

### Login Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@everesttextile.com",
    "password": "Admin@123"
  }'
```

### Get Profile (with token)

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@everesttextile.com | Admin@123 |
| Store Keeper | store@everesttextile.com | Admin@123 |
| Supervisor | supervisor@everesttextile.com | Admin@123 |
| Inspector | inspector@everesttextile.com | Admin@123 |
| Accountant | accounts@everesttextile.com | Admin@123 |

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database exists

### Prisma Error
```bash
npx prisma generate
npx prisma migrate reset
```

### Port Already in Use
Change PORT in .env file or kill the process using port 5000
