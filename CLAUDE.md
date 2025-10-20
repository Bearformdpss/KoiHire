# RowFlow Development Setup

## Quick Start

**Easy Option: Use the batch file**
```bash
# Double-click start-dev.bat in Windows Explorer
# OR run from command prompt:
start-dev.bat
```

**Manual Option: Two separate terminals**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend  
npm run dev
```

## Current Configuration

- **Backend**: http://localhost:5003
- **Frontend**: http://localhost:3000 (or next available port)
- **Health Check**: http://localhost:5003/health

## Demo Accounts

- **Client**: `john.client@example.com` / `password123`
- **Freelancer**: `mike.dev@example.com` / `password123`

## Environment Files

- `backend/.env` - Backend port is set to 5003
- `frontend/.env.local` - API URLs point to port 5003

## Troubleshooting

**Port conflicts:** Run the batch file which automatically cleans up processes first.

**CORS errors:** Backend is configured to allow any localhost origin during development.

## Tech Stack

- **Backend**: Express.js + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **Auth**: JWT with refresh tokens (15min access, 7day refresh)

## Development Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Frontend  
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```