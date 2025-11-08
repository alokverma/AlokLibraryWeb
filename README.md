# Alok Library - Student Subscription Management

A modern full-stack web application for managing student subscriptions with active and expired status tracking.

## Features

- 📋 View all students with their subscription details
- ✅ Active subscriptions section
- ❌ Expired subscriptions section
- 👤 Student profile pictures
- 📞 Phone number display
- 📅 Expiry date tracking
- 🎨 Modern, responsive UI
- 🔌 RESTful API backend
- 💾 JSON-based data storage

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **CORS** - Cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Running the Application

You need to run both the frontend and backend servers.

#### 1. Start the Backend Server

```bash
cd backend
npm install
npm start
```

The backend API will be available at `http://localhost:3000`

#### 2. Start the Frontend (in a new terminal)

```bash
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`

### API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/health` - Health check
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
├── backend/              # Backend API
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── data/            # Data storage (JSON)
│   └── server.js        # Main server file
│
└── src/                  # Frontend application
    ├── components/       # React components
    │   └── StudentCard.tsx
    ├── services/        # API service layer
    │   └── api.ts
    ├── types/           # TypeScript types
    │   └── Student.ts
    ├── App.tsx          # Main application component
    ├── main.tsx         # Application entry point
    └── index.css        # Global styles
```

## Student Data Model

Each student has the following properties:
- `id`: Unique identifier
- `name`: Student's full name
- `phoneNumber`: Contact phone number
- `expiryDate`: Subscription expiry date (YYYY-MM-DD)
- `profilePicture`: URL to profile picture
- `subscriptionStatus`: Either 'active' or 'expired'

# AlokLibraryWeb
