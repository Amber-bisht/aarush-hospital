# Hospital Management System

A production-ready Hospital Management System built with Node.js, Express, raw MySQL queries, Chart.js, and a plain HTML/CSS/JS frontend.

## Project Structure

```text
hospitalmanagmentapp.com/
├── client/
│   ├── index.html          # Redirect entry point
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # Admin dashboard (Chart.js)
│   ├── doctors.html        # Doctor management
│   ├── patients.html       # Patient management
│   ├── appointments.html   # Appointment workflows
│   ├── billing.html        # Billing and payments
│   ├── style.css           # Global CSS design system
│   └── js/
│       ├── api.js           # Fetch-based API layer with JWT refresh
│       ├── auth.js          # Auth helpers (login, register, guard)
│       ├── utils.js         # Formatting and role utilities
│       ├── components.js    # Reusable UI builders (tables, modals, badges)
│       ├── app-shell.js     # Sidebar + topbar injection for authenticated pages
│       ├── login.js
│       ├── register.js
│       ├── dashboard.js
│       ├── doctors.js
│       ├── patients.js
│       ├── appointments.js
│       └── billing.js
├── database/
│   └── schema.sql
├── server/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

## Features

- Prescription capture tied to appointments
- Admin dashboard with Chart.js analytics
- Raw SQL only with MySQL foreign keys and indexes
- Responsive UI with a modern white, black, and pink hospital theme
- Role-based access control (Admin, Doctor, Patient)

## Database

Schema lives in [`database/schema.sql`](./database/schema.sql) and includes:

- `users`
- `patients`
- `doctors`
- `appointments`
- `prescriptions`
- `bills`

## Local Setup

### 1. Configure environment variables

```bash
cp server/.env.example server/.env
```

Update `server/.env` with your MySQL credentials if needed.

### 2. Install dependencies

```bash
cd server && npm install
```

### 3. Start the server

```bash
cd server
npm run dev
```

The server serves both the API and the static frontend on [http://localhost:5000](http://localhost:5000).
