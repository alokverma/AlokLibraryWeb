# Alok Library Backend API

Node.js/Express backend API for managing student subscriptions with PostgreSQL database.

## Features

- RESTful API endpoints for student management
- CRUD operations (Create, Read, Update, Delete)
- Automatic subscription status calculation based on expiry date
- PostgreSQL database for persistent data storage
- CORS enabled for frontend integration
- Environment-based configuration

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

## Request/Response Examples

### Create Student
```json
POST /api/students
{
  "name": "John Doe",
  "phoneNumber": "+91 98765 43210",
  "expiryDate": "2025-12-31",
  "profilePicture": "https://example.com/photo.jpg"
}
```

### Update Student
```json
PUT /api/students/:id
{
  "name": "John Doe Updated",
  "expiryDate": "2026-01-31"
}
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
cd backend
npm install
```

2. Set up PostgreSQL database:

Create a PostgreSQL database:
```sql
CREATE DATABASE alok_library;
```

3. Configure environment variables:

Copy `env.example` to `.env` and update with your database credentials:
```bash
cp env.example .env
```

Edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alok_library
DB_USER=postgres
DB_PASSWORD=your_password_here
# Or use a single connection string (enable DB_SSL=true for managed databases)
# DATABASE_URL=postgres://user:password@host:5432/alok_library
# DB_SSL=true
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
SERVE_FRONTEND=false
JWT_SECRET=replace-me
JWT_EXPIRES_IN=24h
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will automatically create the required database tables on startup. The server will run on `http://localhost:3000`

## Database Schema

The `students` table has the following structure:

```sql
CREATE TABLE students (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  expiry_date DATE NOT NULL,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Storage

Student data is stored in PostgreSQL database. The subscription status is automatically calculated based on the expiry date when data is retrieved.

## Project Structure

```
backend/
  ├── config/          # Configuration files
  │   └── database.js  # PostgreSQL connection pool
  ├── controllers/     # Request handlers
  │   └── studentController.js
  ├── routes/          # API routes
  │   └── students.js
  ├── utils/           # Utility functions
  │   └── dbUtils.js   # Database operations
  ├── scripts/         # Utility scripts
  │   └── migrate.js   # Database migration script
  ├── .env             # Environment variables (not in git)
  ├── .env.example     # Environment variables template
  └── server.js        # Main server file
```

