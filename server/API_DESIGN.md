# Authentication API Design

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### 1. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_123456",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "OWNER",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Account is inactive. Please contact administrator."
}
```

---

### 2. Get Current User
**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER",
    "isActive": true,
    "lastLoginAt": "2026-10-10T12:30:00.000Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### 3. Logout
**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Roles

Backend stores roles in **UPPERCASE** (Prisma enum):

```
OWNER          - Full system access
STOREKEEPER    - Inventory, gate entry, dispatch
SUPERVISOR     - Production floor, machines
INSPECTOR      - Quality control, inspections
ACCOUNTS       - Orders, invoices, payroll
BUYER          - Own orders tracking only
```

Frontend maps these to lowercase:
- `OWNER` → `owner`
- `STOREKEEPER` → `store`
- `SUPERVISOR` → `supervisor`
- `INSPECTOR` → `inspector`
- `ACCOUNTS` → `accounts`
- `BUYER` → `buyer`

---

## Security Features

### Password Requirements
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Hashed using **argon2**

### Token Management
- JWT tokens with 7-day expiration
- Token stored in localStorage on frontend
- Sent via `Authorization: Bearer <token>` header
- Invalidated on logout

### Rate Limiting
- Login endpoint: 5 attempts per 15 minutes per IP
- Failed login tracking with account lockout after 5 attempts

### Session Management
- Track user sessions in database
- Store IP address, user agent
- Automatic session cleanup on token expiration

---

## Error Codes

| Status | Code | Message |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Invalid or missing token |
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 403 | ACCOUNT_INACTIVE | Account is disabled |
| 403 | ACCOUNT_LOCKED | Too many failed attempts |
| 429 | RATE_LIMIT | Too many requests |
| 500 | SERVER_ERROR | Internal server error |

---

## Implementation Checklist

### Database (Prisma Schema)
- [x] User model defined
- [ ] UserSession model for tracking
- [ ] Password hashing setup
- [ ] Role enum configured

### Backend Routes
- [ ] POST /auth/login
- [ ] GET /auth/me
- [ ] POST /auth/logout
- [ ] Middleware for JWT verification
- [ ] Rate limiting middleware

### Frontend Integration
- [x] Login form (SignInPage.jsx)
- [x] AuthContext with role mapping
- [x] API service (authAPI)
- [x] Token storage/retrieval
- [x] Protected routes

---

## Sample Test Users

```javascript
// Seed data for development
const users = [
  { email: 'owner@textile.com', password: 'Admin@123', role: 'OWNER', name: 'Owner Admin' },
  { email: 'store@textile.com', password: 'Admin@123', role: 'STOREKEEPER', name: 'Store Keeper' },
  { email: 'supervisor@textile.com', password: 'Admin@123', role: 'SUPERVISOR', name: 'Production Supervisor' },
  { email: 'inspector@textile.com', password: 'Admin@123', role: 'INSPECTOR', name: 'Quality Inspector' },
  { email: 'accounts@textile.com', password: 'Admin@123', role: 'ACCOUNTS', name: 'Accounts Manager' },
  { email: 'buyer@textile.com', password: 'Admin@123', role: 'BUYER', name: 'Buyer User' },
]
```
