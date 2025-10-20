# KoiHire - Freelance Marketplace Platform

A dual marketplace platform connecting clients with freelancers through both **service listings** (like Fiverr) and **custom project bidding** (reverse marketplace). Built for scalability and modern web standards.

## 🚀 Features

### Core Marketplace
- **Project Posting**: Clients post projects with budget ranges and requirements
- **Freelancer Applications**: Freelancers submit proposals with cover letters and timelines
- **Project Management**: Full CRUD operations for projects and applications
- **Real-time Messaging**: Socket.io powered chat between clients and freelancers
- **Escrow Payments**: Stripe-powered secure payment holding and release
- **Reviews & Ratings**: Bidirectional review system for reputation building

### User Management
- **JWT Authentication**: Access and refresh token system with secure logout
- **Role-based Access**: Separate client and freelancer experiences
- **User Profiles**: Comprehensive profiles with skills, ratings, and portfolios
- **Skills System**: Categorized skills with experience levels

## 🏗️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Payments**: Stripe API integration
- **Real-time**: Socket.io for messaging

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for global state
- **HTTP Client**: Axios with interceptors
- **Real-time**: Socket.io client

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+ database
- Stripe account (for payments)

### Backend Setup

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

Fill in your environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/rowflow_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
```

3. **Setup database**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# Seed with example data
npm run db:seed
```

4. **Start development server**
```bash
npm run dev
```

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
```

3. **Start development server**
```bash
npm run dev
```

## 🎉 Demo Accounts

After running the seed script, you can use these demo accounts:

**Client Account:**
- Email: `john.client@example.com`
- Password: `password123`

**Freelancer Account:**
- Email: `mike.dev@example.com`
- Password: `password123`

## 📊 Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/projects` - List projects with filters
- `POST /api/projects` - Create new project
- `POST /api/applications/:projectId` - Submit application
- `GET /api/messages/conversations` - Get user conversations
- `POST /api/payments/create-payment-intent` - Create escrow payment

## 🚢 Running the MVP

1. Start PostgreSQL database
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Visit `http://localhost:3000`

The complete marketplace flow: project posting → application → hiring → messaging → payment → review is fully functional.

Built with ❤️ for the freelance community