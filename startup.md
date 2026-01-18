# Startup Guide

Follow these steps to run the Kanjabung MRS application.

## Prerequisites
*   Node.js & pnpm installed.
*   Docker installed and running.

## 0. Testing
To run the automated test suite:
**Backend**:
```bash
cd backend
pnpm test
```

**Frontend**:
```bash
cd frontend
pnpm test
```

## 1. Start Database
```bash
docker-compose up -d
```

## 2. Backend Setup
Navigate to `backend` directory:
```bash
cd backend
pnpm install
npx prisma migrate dev --name init
npx prisma db seed
npx nodemon src/index.ts
```
The server will start on `http://localhost:3000`.

## 3. Frontend Setup
Navigate to `frontend` directory (in a new terminal):
```bash
cd frontend
pnpm install
pnpm dev
```
The application will be available at `http://localhost:5173`.

## 4. Default Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@kanjabung.com` | `password123` |
| **Manager** | `manager@kanjabung.com` | `password123` |
| **Employee** | `employee@kanjabung.com` | `password123` |

## 5. Usage Tips
*   Login as **Admin** first to see the Division and User management.
*   Login as **Manager** to create a Goal for your division.
*   Login as **Employee** to create Tasks linked to that Goal.
