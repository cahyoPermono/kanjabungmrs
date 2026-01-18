# Goals Management System Walkthrough

This document outlines the implemented Goals Management System, covering backend setup, key features, and how to run the application.

## 1. System Architecture

*   **Backend**: Node.js, Express, Prisma (v7 with PG Adapter), PostgreSQL.
    *   **Port**: 3000
    *   **Auth**: JWT-based authentication with Role-Based Access Control (RBAC).
    *   **Database**: PostgreSQL running via Docker on port 5433 (mapped).
*   **Frontend**: React, Vite, Tailwind CSS (v3), Shadcn UI, Zustand.
    *   **Port**: 5173 (default Vite)
    *   **State Management**: Zustand for Auth.

## 2. Features Implemented

### Authentication
*   **Login**: Unified login page for all roles.
*   **RBAC**: Middleware protects routes based on `ADMIN`, `MANAGER`, or `EMPLOYEE` roles.

### Admin Dashboard
*   **Manage Divisions**: View list of divisions and employee counts.
*   **Manage Users**: Create new users, assign roles and divisions.

### Manager Dashboard
*   **Goal Management**: Create and view goals for their division.
*   **Team Oversight**: View tasks and progress within the division (integrated via Goal view).

### Employee Dashboard
*   **Task Management**: Create tasks linked to Division Goals.
*   **Status Updates**: Mark tasks as In Progress or Done.
*   **Priority Levels**: Set priority (Low, Medium, High).

## 3. Configuration Details

### Database Schema
*   **User**: `id`, `email`, `role`, `divisionId`
*   **Division**: `id`, `name`
*   **Goal**: `id`, `title`, `divisionId`, `creatorId`
*   **Task**: `id`, `title`, `status`, `goalId`, `assigneeId`

### Verification Results
*   **Backend**: Verified via `verify_backend.ts` script.
    *   Admin, Manager, Employee login flows successful.
    *   CRUD operations for each role verified.
*   **Frontend**: Build successful (`pnpm build`).

## 4. Next Steps for User
1.  Run the backend server.
2.  Run the frontend development server.
3.  Login with default credentials (see `startup.md`).

## 5. Visuals
(Since I cannot capture screenshots, please trust the code!)
