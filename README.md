# Dacby Order Management Frontend

This repository contains the React dashboard for the Dacby order management assignment. The UI is built to work with a Node.js and Express backend that exposes order APIs, order history, and scheduler logs.

## What This Frontend Covers

- Order list with status filtering, search, pagination, and auto-refresh
- Order creation modal with client-side idempotency key generation
- Order detail modal with status history and audit trail
- Scheduler dashboard for manual trigger testing and execution log review
- Loading, empty, and error states across the main views

## Tech Stack

- React 19
- Vite
- React Router DOM
- Axios
- Tailwind CSS v4

## Backend API Contract

The frontend expects these endpoints from the companion backend:

- `GET /v1/orders` with optional `status`, `search`, `page`, and `limit`
- `POST /v1/orders`
- `GET /v1/orders/:orderId`
- `GET /v1/orders/:orderId/history`
- `GET /v1/scheduler/logs`
- `POST /v1/scheduler/run-status-update`

The scheduler trigger endpoint expects the secret in the `x-scheduler-secret` header.

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://dacby-backend-kmf7.onrender.com/api
```

If `VITE_API_BASE_URL` is not set, the app falls back to `https://dacby-backend-kmf7.onrender.com/api`.

## Local Development
1. Install dependencies:

    npm install

2. Start the frontend:
    npm run dev

3. Build for production:

    npm run build

4. Preview the production build:

    npm run preview

## Scheduler Setup

The assignment requires the status-update job to run every 5 minutes. Any cron-based scheduler can call the backend endpoint below:

```bash
POST /v1/scheduler/run-status-update
Header: x-scheduler-secret: secret
```
