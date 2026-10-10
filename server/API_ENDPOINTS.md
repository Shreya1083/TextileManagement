# API Endpoints Documentation

Base URL: `http://localhost:5000/api`

## Authentication Required
All endpoints except `/auth/login` require a valid JWT token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 1. Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "owner@everesttextile.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "owner@everesttextile.com",
      "name": "Factory Owner",
      "role": "OWNER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Profile
```http
GET /auth/me
Authorization: Bearer TOKEN
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "currentPassword": "Admin@123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### User Management (Owner Only)

#### Create User
```http
POST /auth/users
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "email": "newuser@everesttextile.com",
  "password": "password123",
  "name": "New User",
  "role": "STOREKEEPER",
  "isActive": true
}
```

#### Get All Users
```http
GET /auth/users?role=STOREKEEPER&isActive=true&page=1&limit=50
Authorization: Bearer TOKEN
```

#### Update User
```http
PUT /auth/users/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "SUPERVISOR",
  "isActive": false
}
```

#### Delete User
```http
DELETE /auth/users/:id
Authorization: Bearer TOKEN
```

---

## 2. Inventory Management

### Suppliers

#### Create Supplier
```http
POST /inventory/suppliers
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: OWNER, STOREKEEPER, ACCOUNTS

{
  "name": "ABC Yarn Suppliers",
  "contactName": "Rajesh Kumar",
  "phone": "+91-9876543210",
  "email": "contact@abcyarn.com",
  "address": "Mumbai, Maharashtra",
  "gstin": "27AAAAA0000A1Z5"
}
```

#### Get All Suppliers
```http
GET /inventory/suppliers?isActive=true&page=1&limit=50
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

#### Get Supplier by ID
```http
GET /inventory/suppliers/:id
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

#### Update Supplier
```http
PUT /inventory/suppliers/:id
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: OWNER, STOREKEEPER, ACCOUNTS

{
  "name": "Updated Supplier Name",
  "isActive": false
}
```

#### Delete Supplier
```http
DELETE /inventory/suppliers/:id
Authorization: Bearer TOKEN
Roles: OWNER only
```

---

### Yarn Types

#### Create Yarn Type
```http
POST /inventory/yarn-types
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: OWNER, STOREKEEPER

{
  "name": "Cotton 30s",
  "count": "30",
  "color": "White",
  "unit": "kg",
  "reorderLevel": 500
}
```

#### Get All Yarn Types
```http
GET /inventory/yarn-types?page=1&limit=50
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, SUPERVISOR, ACCOUNTS
```

#### Get Yarn Type by ID
```http
GET /inventory/yarn-types/:id
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

#### Update Yarn Type
```http
PUT /inventory/yarn-types/:id
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: OWNER, STOREKEEPER

{
  "reorderLevel": 600,
  "color": "Bleached White"
}
```

#### Delete Yarn Type
```http
DELETE /inventory/yarn-types/:id
Authorization: Bearer TOKEN
Roles: OWNER only
```

---

### Gate Entries (GRN)

#### Create Gate Entry
```http
POST /inventory/gate-entries
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: STOREKEEPER

{
  "grnNumber": "GRN-2026-001",
  "supplierId": "clx...",
  "yarnTypeId": "clx...",
  "lotNumber": "LOT-ABC-001",
  "quantity": 1000,
  "bags": 20,
  "cones": 200,
  "vehicleNumber": "MH-12-AB-1234",
  "challanNumber": "CH-2026-456",
  "receivedBy": "USER_ID"
}
```

**Note:** This automatically creates:
- Stock batch (or updates existing batch with same lot number)
- Stock movement record (IN type)

#### Get All Gate Entries
```http
GET /inventory/gate-entries?supplierId=xxx&yarnTypeId=yyy&page=1&limit=50
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

#### Get Gate Entry by ID
```http
GET /inventory/gate-entries/:id
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

---

### Stock Management

#### Get Stock Levels
```http
GET /inventory/stock?yarnTypeId=xxx&lowStock=true
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, SUPERVISOR, ACCOUNTS
```

**Response includes:**
- Total quantity by yarn type
- Reserved quantity
- Available quantity
- All batches with lot numbers
- Low stock warnings

#### Get Stock Ledger
```http
GET /inventory/stock/ledger?yarnTypeId=xxx&movementType=IN&page=1&limit=100
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

**Movement Types:** IN, OUT, ADJUST

---

### Purchase Orders

#### Create Purchase Order
```http
POST /inventory/purchase-orders
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: OWNER, STOREKEEPER, ACCOUNTS

{
  "poNumber": "PO-2026-001",
  "supplierId": "clx...",
  "expectedDate": "2026-11-01T00:00:00Z",
  "notes": "Urgent order",
  "items": [
    {
      "yarnTypeId": "clx...",
      "quantity": 1000,
      "unitPrice": 25000
    },
    {
      "yarnTypeId": "clx...",
      "quantity": 500,
      "unitPrice": 30000
    }
  ]
}
```

**Note:** Unit price is in paise (1 Rupee = 100 paise)

#### Get All Purchase Orders
```http
GET /inventory/purchase-orders?supplierId=xxx&status=RAISED&page=1&limit=50
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

**Status values:** RAISED, PARTIALLY_RECEIVED, RECEIVED

#### Get Purchase Order by ID
```http
GET /inventory/purchase-orders/:id
Authorization: Bearer TOKEN
Roles: OWNER, STOREKEEPER, ACCOUNTS
```

#### Update Purchase Order
```http
PUT /inventory/purchase-orders/:id
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: OWNER, STOREKEEPER, ACCOUNTS

{
  "status": "RECEIVED",
  "notes": "Updated notes"
}
```

#### Receive Purchase Order Items
```http
POST /inventory/purchase-orders/:id/receive
Authorization: Bearer TOKEN
Content-Type: application/json
Roles: STOREKEEPER

{
  "items": [
    {
      "itemId": "clx...",
      "quantityReceived": 500
    },
    {
      "itemId": "clx...",
      "quantityReceived": 250
    }
  ]
}
```

**Note:** This automatically updates:
- Received quantity for each item
- PO status (PARTIALLY_RECEIVED or RECEIVED)
- Received date when fully received

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Success with Pagination
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 123,
    "totalPages": 3
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "errors": {
    "field": "Field-specific error"
  }
}
```

---

## HTTP Status Codes

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate entry
- `500 Internal Server Error` - Server error

---

## Role-Based Access Control

| Endpoint | OWNER | STOREKEEPER | SUPERVISOR | INSPECTOR | ACCOUNTS |
|----------|-------|-------------|------------|-----------|----------|
| User Management | ✓ | ✗ | ✗ | ✗ | ✗ |
| Suppliers | ✓ | ✓ | ✗ | ✗ | ✓ |
| Yarn Types | ✓ | ✓ | View | ✗ | View |
| Gate Entries | View | ✓ | ✗ | ✗ | View |
| Stock | ✓ | ✓ | View | ✗ | View |
| Purchase Orders | ✓ | ✓ | ✗ | ✗ | ✓ |

---

## Testing with cURL

### Example: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@everesttextile.com","password":"Admin@123"}'
```

### Example: Get Stock Levels
```bash
curl -X GET http://localhost:5000/api/inventory/stock \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example: Create Supplier
```bash
curl -X POST http://localhost:5000/api/inventory/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier",
    "contactName": "John Doe",
    "phone": "+91-1234567890",
    "email": "test@example.com"
  }'
```

---

## Next Steps

The following API modules are planned:
- ✅ Authentication
- ✅ Inventory Management
- ⏳ Buyers and Orders
- ⏳ Production Floor
- ⏳ Quality Control
- ⏳ Dispatch and Invoicing
- ⏳ HR and Attendance
- ⏳ Finance and Reporting
- ⏳ Public Buyer Tracking
