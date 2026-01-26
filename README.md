# Lead Management System (LMS) Backend

A production-ready NestJS backend for managing leads, influencers, interactions, and sales.

## Tech Stack

- NestJS (latest)
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcrypt
- class-validator + class-transformer
- dotenv
- ESLint

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
PORT=3000
```

3. Create admin user (required for first-time setup):
```bash
npm run seed:admin
```

   Or with custom credentials:
```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=YourSecurePassword ADMIN_NAME="Admin Name" ADMIN_MOBILE="1234567890" npm run seed:admin
```

   Default credentials:
   - Email: `admin@lms.com`
   - Password: `Admin@123`

4. Start the development server:
```bash
npm run start:dev
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login and get JWT token

### Admin Endpoints (Requires ADMIN role)

#### User Management
- `GET /admin/users` - Get all users
- `POST /admin/users` - Create a new user (ADMIN or NON_ADMIN)

#### Influencer Management
- `GET /admin/influencers` - Get all influencers
- `POST /admin/influencers` - Create influencer
- `POST /admin/influencers/:id/source-code` - Add source code to influencer

#### Dashboard
- `GET /admin/dashboard/summary` - Admin dashboard summary
- `GET /admin/dashboard/sales-executives` - Sales executive performance
- `GET /admin/dashboard/influencers` - Influencer-wise sales

### Sales Endpoints (Requires JWT authentication)
- `GET /sales/influencers` - Get active influencers with active source codes only
- `POST /sales/leads` - Create or fetch existing lead by mobile
- `GET /sales/leads/by-mobile?mobile=` - Get lead by mobile number
- `POST /sales/lead-interactions` - Create lead interaction
- `POST /sales/convert` - Convert lead to sale
- `GET /sales/my-sales` - Get my sales
- `GET /sales/dashboard/summary` - Sales dashboard summary

## Business Rules

### Leads
- Mobile number is globally unique
- If mobile already exists, fetch existing lead (do NOT create new)
- Mobile number cannot be updated
- Influencer is fixed forever for a lead

### Influencers
- Only ONE influencer document per real influencer
- On re-hire: add new source code, mark previous ACTIVE as INACTIVE
- Non-admin users see ONLY ACTIVE source codes
- Source codes are never deleted

### Sales
- Sale exists only when Converted = true
- A lead can be converted only once

### Ratings
- Rating scale: 1-5
- Interested: rating ≥ 3
- Non-interested: rating ≤ 2
- Wrong number overrides rating

## Project Structure

```
src/
├── auth/          # Authentication module
├── users/         # User schema and service
├── influencers/   # Influencer management
├── leads/         # Lead management
├── lead-interactions/  # Lead interaction tracking
├── sales/         # Sales conversion
├── dashboard/     # Dashboard aggregations
├── common/        # Guards, decorators, filters
├── config/        # Configuration
├── app.module.ts
└── main.ts
```

## License

Private - All rights reserved

