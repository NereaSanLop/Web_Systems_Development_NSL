# Time Bank - User Management System

A full-stack web user management system with JWT authentication, user roles (admin/user), and MVC architecture.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)

## Features

### Authentication and Authorization
- User registration with optional admin role
- JWT login (JSON Web Tokens)
- Route protection based on authentication
- Role-based access control (RBAC)

### User Management
- Personalized dashboard for each user
- Administration panel for admin users
- Full user CRUD (admin only)
- Profile view with name, email, and role

### User Interface
- Responsive design with Bootstrap 5
- Intuitive navigation between views
- Alerts and confirmations for critical actions
- Loading states (spinners)

## Technologies

### Backend
- **FastAPI** - Modern and fast web framework
- **SQLAlchemy** - ORM for database management
- **SQLite** - Lightweight database
- **PyJWT** - Token generation and validation
- **Passlib & Bcrypt** - Secure password hashing
- **Pydantic** - Data validation

### Frontend
- **React 19** - User interface library
- **React Router DOM** - SPA routing
- **Axios** - HTTP client
- **Bootstrap 5** - Responsive CSS framework

## Architecture

The project follows the **MVC (Model-View-Controller)** pattern:

### Backend (FastAPI)
```
├── Models (models.py)          -> Entity definitions (User, Role)
├── Views (routers/)            -> HTTP endpoints
└── Controllers (controllers/)  -> Business logic
```

### Frontend (React)
```
├── Models (localStorage)       -> Token management
├── Views (components/)         -> React components
└── Controllers (controllers/)  -> Business logic and API calls
```

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Backend

```bash
# Clone the repository
git clone https://github.com/NereaSanLop/Web_Systems_Development_NSL.git
cd Web_Systems_Development_NSL

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
[Set-ExecutionPolicy RemoteSigned -Scope CurrentUser]
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create backend/.env and add:
# SECRET_KEY=your_secret_string_with_minimum_32_characters
# There is a backend/.env.example file you can use as reference

# Start the backend server
cd backend
uvicorn app.main:app --reload
```

The backend will be available at: `http://127.0.0.1:8000`

### Frontend

```bash
# In another terminal, go to the frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at: `http://localhost:3000`

## Usage

### 1. User Registration

- Go to `http://localhost:3000/signup`
- Fill out the form with:
  - Name
  - Email
  - Password
- Click "Sign Up"

### 2. Log In

- Go to `http://localhost:3000/login`
- Enter your email and password
- You will be redirected to the Dashboard

### 3. Dashboard (Regular User)

- View your profile (name, email, role)
- Log out

### 4. Administration Panel (Admin Only)

- From the Dashboard, click "Manage"
- View full user list
- Change roles
- Delete users (with confirmation)
- Return to the Dashboard

## Project Structure

```
Web_Systems_Development_NSL/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── __init__.py
│   │   │   ├── auth_controller.py      # Authentication logic
│   │   │   └── user_controller.py      # User logic
│   │   ├── routers/
│   │   │   ├── auth_router.py          # Auth endpoints
│   │   │   └── users_router.py         # User endpoints
│   │   ├── auth.py                     # JWT and password hashing
│   │   ├── database.py                 # DB configuration
│   │   ├── dependencies.py             # FastAPI dependencies
│   │   ├── main.py                     # Entry point
│   │   ├── models.py                   # SQLAlchemy models
│   │   └── schemas.py                  # Pydantic schemas
│   ├── requirements.txt
│   └── timebank.db                     # SQLite database
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin.js                # Administration panel
│   │   │   ├── Dashboard.js            # User dashboard
│   │   │   ├── Home.js                 # Home page
│   │   │   ├── Login.js                # Login form
│   │   │   ├── Signup.js               # Registration form
│   │   │   └── ProtectedRoute.jsx      # HOC for protected routes
│   │   ├── controllers/
│   │   │   ├── authController.js       # Authentication logic
│   │   │   └── userController.js       # User logic
│   │   ├── services/
│   │   │   └── api.js                  # Axios configuration
│   │   ├── App.js                      # Main component
│   │   └── index.js                    # Entry point
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── README.md
└── requirements.txt
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/signup` | Register a new user | No |
| POST | `/login` | Log in | No |

**Request Body - Signup:**
```json
{
  "name": "Juan Perez",
  "email": "juan@example.com",
  "password": "mypassword123",
  "is_admin": false
}
```

**Request Body - Login:**
```json
{
  "email": "juan@example.com",
  "password": "mypassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Users

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/me` | Get current user profile | Yes | user/admin |
| GET | `/users` | List all users | Yes | admin |
| DELETE | `/users/{user_id}` | Delete a user | Yes | admin |

**Response - GET /me:**
```json
{
  "id": 1,
  "name": "Juan Perez",
  "email": "juan@example.com",
  "role": "user"
}
```

**Response - GET /users:**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  {
    "id": 2,
    "name": "Juan Perez",
    "email": "juan@example.com",
    "role": "user"
  }
]
```

### Required Headers for Protected Endpoints

```
Authorization: Bearer <jwt_token>
```

## Security

- Passwords hashed with bcrypt
- JWT tokens with expiration (60 minutes)
- Token validation on every protected request
- CORS configured for development
- Protected routes in both frontend and backend
- Confirmation before destructive actions

## Testing

### Interactive API Documentation

FastAPI automatically generates interactive documentation:

```
http://127.0.0.1:8000/docs
```

You can test all endpoints directly from the browser.