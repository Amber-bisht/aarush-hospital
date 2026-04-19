# Hospital Management System

A production-ready Hospital Management System built with React, Vite, TailwindCSS, React Router, Node.js, Express, raw MySQL queries, JWT authentication, Chart.js, Docker, and docker-compose.

## Project Structure

```text
hospitalmanagmentapp.com/
├── client/
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── vite.config.js
├── database/
│   ├── schema.sql
├── server/
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

## Features

- JWT access and refresh token authentication with bcrypt password hashing
- Role-aware experiences for `admin`, `doctor`, and `patient`
- Patient CRUD, self-service views, doctor directory, appointment workflows, and billing
- Prescription capture tied to appointments
- Admin dashboard with Chart.js analytics
- Raw SQL only with MySQL foreign keys and indexes
- Responsive UI with a modern white, black, and pink hospital theme

## Database

Schema lives in [`database/schema.sql`](./database/schema.sql) and includes:

- `users`
- `patients`
- `doctors`
- `appointments`
- `prescriptions`
- `bills`

Seed data lives in [`database/seed.sql`](./database/seed.sql).

### Seed Credentials

- Admin: `admin@hospital.com`
- Doctor: `doctor@hospital.com`
- Patient: `patient@hospital.com`
- Password: `Password123!`

## Local Setup

### 1. Create the MySQL database

```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

Or run:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update `server/.env` with your MySQL credentials if needed.

### 3. Install dependencies

```bash
cd server && npm install
cd client && npm install
```

### 4. Start the backend

```bash
cd server
npm run dev
```

### 5. Start the frontend

```bash
cd client
npm run dev
```

Frontend runs on [http://localhost:5173](http://localhost:5173) and backend runs on [http://localhost:5000](http://localhost:5000).
