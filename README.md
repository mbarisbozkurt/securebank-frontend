# SecureBank Frontend

SecureBank Frontend is a React + TypeScript application for the SecureBank banking project.

It connects to the Spring Boot backend and provides the customer and admin user interface for accounts, transfers, saved recipients, transaction history, receipts, and audit/admin views.

Live frontend:

```text
https://d1zrdkm958a5xk.cloudfront.net
```

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- Lucide React
- jsPDF
- Manrope font

## Features

- Register
- Login
- Dashboard
- Account list
- Money transfer
- Saved recipients
- Transaction history
- Transfer receipt and PDF download
- Admin dashboard
- Admin audit logs

## User Flow

1. User registers or logs in.
2. User creates a bank account.
3. Admin funds the account for local testing.
4. User saves a recipient or enters a recipient IBAN.
5. User sends a money transfer.
6. User views transaction history and transfer receipt.
7. Sender and recipient receive email notifications.
8. Admin reviews dashboard metrics and audit logs.

## Backend API

The app uses this default backend URL:

```text
http://localhost:8081
```

It can be changed with:

```text
VITE_API_BASE_URL=http://localhost:8081
```

Production uses this API base URL:

```text
VITE_API_BASE_URL=https://api-63-180-21-244.nip.io
```

The API base URL is not opened directly by users. It is called by the frontend, and protected endpoints return `401 Unauthorized` without a valid session.

Start the backend stack from the backend repository:

```powershell
cd ..\securebank-backend
docker compose up -d --build
```

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the Vite dev server:

```powershell
npm run dev
```

## Verification

```powershell
npm run lint
npm run build
```

## Related Projects

- `securebank-backend`: Main banking backend and Docker Compose entrypoint.
- `securebank-notification-service`: RabbitMQ notification microservice.
