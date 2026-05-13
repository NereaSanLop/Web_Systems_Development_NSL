# Time Bank - Peer-to-Peer Service Exchange Platform

A full-stack web application for exchanging services and managing time credits using a peer-to-peer marketplace model. Users can create services, request services from others, manage credit transactions, and leave reviews—all with secure JWT authentication and Stripe payment integration.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Run with Makefile](#run-with-makefile)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Security](#security)

## Features

### Authentication & Authorization
- User registration with JWT authentication
- Secure password hashing with bcrypt
- Role-based access control (RBAC) - Admin and User roles
- Token-based route protection on both frontend and backend
- Account deactivation by admins

### User Management
- Personalized user dashboard with profile view
- Admin panel for managing users and system-wide data
- Change user roles (Admin/User)
- Toggle user active/inactive status
- User credit tracking and balance management
- Transaction history for all users

### Service Marketplace
- Create and manage services with title and credit cost
- Browse services from other users with search and filtering
- Service visibility toggle (hidden services don't appear in browse)
- Dynamic rating and review count per service
- Simple filters: search by title, cost range (min/max)

### Service Requests & Workflow
- Request a service from another user (requires sufficient credits)
- Request lifecycle: requested → accepted → completed
- Provider can accept, reject, or cancel requests
- Requester can cancel pending/accepted requests
- Credit transfer on completion (requester pays provider)
- Prevent duplicate open requests per requester-service pair
- Comprehensive audit trail via transaction records

### Reviews & Ratings
- Submit 5-star ratings and optional comments after service completion
- One review per completed request (requester only)
- View all reviews for a service with aggregate ratings
- Admin moderation: delete inappropriate reviews
- Reviews visible after service completion

### Payment System (Stripe Integration)
- Purchase time credits via Stripe Checkout
- Payment history tracking
- Automatic credit top-up on successful payment
- Webhook handling for payment confirmation
- Transaction audit trail for all credit operations
- Admin monitoring of all payments

### User Interface
- Responsive design with Bootstrap 5
- Multi-tab dashboard (Services, Requests, Transactions, Reviews)
- Pagination for lists (5 items per page)
- Modal dialogs for confirmations and reviews
- Loading states with spinners
- Real-time error notifications
- Intuitive navigation between views

## Technologies

### Backend
- **FastAPI** - Modern Python web framework with automatic API documentation
- **SQLAlchemy** - ORM for database management
- **SQLite** - Lightweight embedded database
- **PyJWT** - JWT token generation and validation
- **Passlib & Bcrypt** - Secure password hashing
- **Pydantic** - Data validation and serialization
- **Stripe SDK** - Payment processing integration

### Frontend
- **React 19** - UI library with hooks
- **React Router DOM v6** - SPA routing and navigation
- **Axios** - HTTP client with request/response interceptors
- **Bootstrap 5** - Responsive CSS framework
- **Stripe.js** - Client-side payment integration

## Architecture

The project follows the **MVC (Model-View-Controller)** pattern with clean separation of concerns:

### Backend Structure
```
app/
├── models.py              # SQLAlchemy ORM models
├── schemas.py             # Pydantic request/response schemas
├── database.py            # SQLAlchemy session management
├── auth.py                # JWT and password utilities
├── settings.py            # Configuration and environment loading
├── dependencies.py        # FastAPI dependency injection (auth guards)
├── main.py                # Application entry point and startup
├── controllers/           # Business logic layer
│   ├── auth_controller.py
│   ├── user_controller.py
│   ├── service_controller.py
│   └── payment_controller.py
└── routers/               # HTTP endpoint definitions
    ├── auth_router.py
    ├── users_router.py
    ├── services_router.py
    └── payment_router.py
```

### Frontend Structure
```
src/
├── components/            # React components
│   ├── Home.js           # Landing page
│   ├── Login.js          # Authentication form
│   ├── Signup.js         # Registration form
│   ├── Dashboard.js      # User dashboard (multi-tab)
│   ├── Services.js       # Service browse and search
│   ├── BuyCredits.js     # Payment interface
│   ├── Admin.js          # Admin panel
│   ├── PaymentSuccess.js # Stripe success callback
│   ├── PaymentCancel.js  # Stripe cancel callback
│   ├── ProtectedRoute.jsx # HOC for route protection
│   └── App.js            # Root component with routing
├── controllers/           # API business logic
│   ├── authController.js
│   ├── userController.js
│   ├── serviceController.js
│   └── paymentController.js
├── services/
│   └── api.js            # Axios instance with interceptors
└── index.js              # React DOM render
```

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn
- Stripe account (for payment features)

### Backend Setup

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
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## Environment Configuration

### Backend Environment Variables

Create a `backend/.env` file with the following variables:

```bash
# Required - Secret key for JWT signing (minimum 32 characters)
SECRET_KEY=your_very_secure_secret_key_with_at_least_32_characters

# Optional - Stripe payment configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Optional - Frontend URL for Stripe redirects (default: http://localhost:3000)
FRONTEND_URL=http://localhost:3000
```

A reference file `backend/.env.example` is provided in the repository.

### Frontend Configuration

The frontend API URL is configured in `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://127.0.0.1:8000';
```

Update this if your backend runs on a different URL.

## Run with Makefile

Use these commands from the project root:

```bash
# Install all dependencies
make install

# Run backend and frontend together
make dev

# Run backend only
make back

# Run frontend only
make front

# Stop processes on ports 8000 and 3000
make stop
```

## Usage

### 1. User Registration

- Navigate to `http://localhost:3000/signup`
- Enter name, email, and password
- Click "Sign Up"
- You will be redirected to login

### 2. Log In

- Go to `http://localhost:3000/login`
- Enter your credentials
- After successful login, you'll be redirected to the dashboard

### 3. Dashboard Overview

The dashboard has multiple tabs:

#### My Services Tab
- View services you've created
- Edit or delete your services
- See ratings and review count for each service

#### Browse Services Tab
- Search for services by title
- Filter by cost range (min/max credits)
- Click "Request" to request a service
- View provider email and service reviews

#### Requests Tab
- **Incoming**: Requests from other users for your services
  - Accept (marks as "accepted")
  - Reject (marks as "rejected")
  - Complete (after accepting, transfers credits)
- **Outgoing**: Your requests to others
  - Cancel pending/accepted requests
  - View request status

#### Transactions Tab
- Complete history of all credit movements
- Shows direction (+ credit, - debit), amount, and counterparty

#### Reviews Tab
- Submit reviews for completed services (5-star + optional comment)
- View your submitted reviews
- Only available after service completion

### 4. Buy Credits

- Click "Buy Credits" from the dashboard
- Enter desired credit amount
- Proceed to Stripe Checkout
- Successful payment adds credits to your account
- View payment history in the panel

### 5. Administration Panel (Admin Only)

- Click "Manage" from dashboard (admin users only)
- Tabs for managing:
  - **Users**: View all users, change roles, toggle active status, delete
  - **Services**: View all services, toggle visibility, delete
  - **Transactions**: View system transaction audit log
  - **Requests**: View all service requests
  - **Reviews**: Moderate reviews, delete if necessary
  - **Payments**: Monitor all Stripe transactions

## Project Structure

```
Web_Systems_Development_NSL/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── __init__.py
│   │   │   ├── auth_controller.py
│   │   │   ├── user_controller.py
│   │   │   ├── service_controller.py
│   │   │   └── payment_controller.py
│   │   ├── routers/
│   │   │   ├── auth_router.py
│   │   │   ├── users_router.py
│   │   │   ├── services_router.py
│   │   │   └── payment_router.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── settings.py
│   ├── requirements.txt
│   ├── timebank.db
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin.js
│   │   │   ├── App.js
│   │   │   ├── BuyCredits.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── PaymentCancel.js
│   │   │   ├── PaymentSuccess.js
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Services.js
│   │   │   └── Signup.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── paymentController.js
│   │   │   ├── serviceController.js
│   │   │   └── userController.js
│   │   ├── services/
│   │   │   └── api.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── Makefile
└── README.md
```

## API Endpoints

All endpoints except `/signup` and `/login` require an `Authorization: Bearer <token>` header.

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | No | Register a new user |
| POST | `/login` | No | Authenticate and receive JWT token |

**POST /signup**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": {
    "id": 1,
    "name": "user"
  }
}
```

**POST /login**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### User Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/me` | Yes | user/admin | Get current user profile |
| GET | `/users` | Yes | admin | List all users |
| DELETE | `/users/{user_id}` | Yes | admin | Delete a user |
| PUT | `/users/{user_id}/role` | Yes | admin | Change user role |
| PUT | `/users/{user_id}/toggle-active` | Yes | admin | Toggle user active status |
| GET | `/transactions/me` | Yes | user/admin | Get user's transaction history |
| GET | `/admin/transactions` | Yes | admin | Get all transactions |

**GET /me**

Response:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "credits": 50,
  "role": {
    "id": 2,
    "name": "user"
  },
  "is_active": true
}
```

**GET /users**

Response:
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "email": "admin@admin.com",
    "credits": 0,
    "role": {
      "id": 1,
      "name": "admin"
    },
    "is_active": true
  },
  {
    "id": 2,
    "name": "John Doe",
    "email": "john@example.com",
    "credits": 50,
    "role": {
      "id": 2,
      "name": "user"
    },
    "is_active": true
  }
]
```

**PUT /users/{user_id}/role**

Request:
```json
{
  "role": "admin"
}
```

Response:
```json
{
  "message": "Role changed successfully",
  "new_role": "admin"
}
```

**GET /transactions/me**

Response:
```json
[
  {
    "id": 1,
    "user_email": "john@example.com",
    "counterparty_email": "jane@example.com",
    "amount": 10,
    "direction": "debit",
    "reason": "service_payment",
    "created_at": "2024-05-13T10:30:00"
  }
]
```

---

### Service Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/services/browse` | Yes | Browse services (search & filter) |
| GET | `/services` | Yes | Get user's own services |
| POST | `/services` | Yes | Create a new service |
| PUT | `/services/{service_id}` | Yes | Update a service |
| DELETE | `/services/{service_id}` | Yes | Delete a service |
| GET | `/admin/services` | Yes (admin) | Get all services (admin) |
| DELETE | `/admin/services/{service_id}` | Yes (admin) | Delete service (admin) |
| PUT | `/admin/services/{service_id}/toggle-visibility` | Yes (admin) | Toggle visibility (admin) |

**POST /services**

Request:
```json
{
  "title": "Web Development",
  "cost": 15
}
```

Response:
```json
{
  "id": 1,
  "title": "Web Development",
  "cost": 15,
  "owner_email": "john@example.com",
  "is_visible": true,
  "avg_rating": null,
  "review_count": 0
}
```

**GET /services/browse?q=web&min_cost=10&max_cost=20**

Query Parameters:
- `q` (optional): Search by service title
- `min_cost` (optional): Minimum credit cost
- `max_cost` (optional): Maximum credit cost

Response: List of services with ratings

---

### Service Request Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/services/{service_id}/requests` | Yes | Request a service |
| GET | `/service-requests/incoming` | Yes | Get requests you received |
| GET | `/service-requests/outgoing` | Yes | Get requests you made |
| POST | `/service-requests/{request_id}/accept` | Yes | Accept a request (provider) |
| POST | `/service-requests/{request_id}/reject` | Yes | Reject a request (provider) |
| POST | `/service-requests/{request_id}/cancel` | Yes | Cancel a request |
| POST | `/service-requests/{request_id}/complete` | Yes | Complete request & transfer credits (provider) |
| GET | `/admin/service-requests` | Yes (admin) | Get all requests (admin) |

**POST /services/{service_id}/requests**

Response:
```json
{
  "id": 1,
  "service_id": 5,
  "requester_email": "john@example.com",
  "provider_email": "jane@example.com",
  "cost": 15,
  "status": "requested",
  "created_at": "2024-05-13T10:30:00"
}
```

Request statuses: `requested` → `accepted` → `completed`
Also possible: `rejected`, `cancelled`

---

### Review Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/service-requests/{request_id}/review` | Yes | Submit a review |
| GET | `/services/{service_id}/reviews` | Yes | Get reviews for a service |
| GET | `/reviews/mine` | Yes | Get your submitted reviews |
| GET | `/admin/reviews` | Yes (admin) | Get all reviews (admin) |
| DELETE | `/admin/reviews/{review_id}` | Yes (admin) | Delete a review (admin) |

**POST /service-requests/{request_id}/review**

Request:
```json
{
  "rating": 5,
  "comment": "Excellent work!"
}
```

Response:
```json
{
  "id": 1,
  "service_request_id": 5,
  "service_id": 3,
  "reviewer_email": "john@example.com",
  "rating": 5,
  "comment": "Excellent work!",
  "created_at": "2024-05-13T15:45:00"
}
```

---

### Payment Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/create-checkout-session` | Yes | Create Stripe checkout session |
| POST | `/payments/webhook` | No | Stripe webhook (no auth) |
| GET | `/payments/my` | Yes | Get user's payment history |
| GET | `/admin/payments` | Yes (admin) | Get all payments (admin) |

**POST /payments/create-checkout-session**

Request:
```json
{
  "credits": 10
}
```

Response:
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_live_..."
}
```

**GET /payments/my**

Response:
```json
[
  {
    "id": 1,
    "stripe_session_id": "cs_live_...",
    "user_email": "john@example.com",
    "credits": 10,
    "amount_eur_cents": 1000,
    "status": "completed",
    "completed_at": "2024-05-13T10:30:00"
  }
]
```

Payment statuses: `pending` → `completed`, also possible: `failed`

---

## Database Models

### User
- `id`: Primary key
- `name`: User's display name
- `email`: Unique email (login identifier)
- `hashed_password`: bcrypt-hashed password
- `credits`: Integer balance of time credits
- `role_id`: Foreign key to Role
- `is_active`: Boolean (admin can deactivate accounts)
- `created_at`: Timestamp

### Role
- `id`: Primary key
- `name`: "admin" or "user"

### Service
- `id`: Primary key
- `title`: Service name
- `cost`: Credit cost per request
- `owner_email`: Email of service creator
- `is_visible`: Boolean (toggle visibility)
- `created_at`: Timestamp

### ServiceRequest
- `id`: Primary key
- `service_id`: Foreign key to Service
- `requester_email`: User requesting the service
- `provider_email`: Service owner email
- `cost`: Cost at time of request (snapshot)
- `status`: requested/accepted/completed/rejected/cancelled
- `created_at`: Timestamp

### ServiceReview
- `id`: Primary key
- `service_request_id`: Foreign key to ServiceRequest
- `service_id`: Foreign key to Service
- `reviewer_email`: User who submitted review
- `rating`: 1-5 stars
- `comment`: Optional text (max 1000 chars)
- `created_at`: Timestamp

### Transaction
- `id`: Primary key
- `user_email`: User account being affected
- `counterparty_email`: Other party in transaction
- `service_id`: Optional link to service
- `service_request_id`: Optional link to request
- `amount`: Credit amount
- `direction`: "credit" or "debit"
- `reason`: service_payment, stripe_topup, admin_adjustment, etc.
- `created_at`: Timestamp

### StripePayment
- `id`: Primary key
- `stripe_session_id`: Stripe session identifier
- `user_email`: User making purchase
- `credits`: Amount purchased
- `amount_eur_cents`: Amount in EUR cents
- `status`: pending/completed/failed
- `completed_at`: Timestamp (when payment completed)

---

## Security

### Authentication & Authorization
- JWT tokens with 60-minute expiration
- Passwords hashed with bcrypt (72-char truncation for bcrypt limits)
- Token validation on every protected request
- Role-based access control via `get_admin_user` dependency

### Data Protection
- Email uniqueness enforced at database level
- Service requests validated (credit availability, ownership, etc.)
- Transaction records for all credit movements
- Webhook signature validation for Stripe payments

### CORS
- Configured for development: `http://localhost:3000`
- Adjust in `backend/app/main.py` for production

### Stripe Integration
- Webhook signature validation with `STRIPE_WEBHOOK_SECRET`
- PCI compliance via hosted Stripe Checkout
- Session-level transaction tracking
- No credit card data stored locally

---

## API Documentation

Interactive API documentation is available at:

```
http://127.0.0.1:8000/docs          (Swagger UI)
http://127.0.0.1:8000/redoc         (ReDoc)
```

Test all endpoints directly from your browser with automatic request/response examples.

---

## Future Enhancements

- Real-time notifications for requests and reviews
- Advanced filtering and sorting options
- User rating history and reputation scores
- Message system between users
- Service categories and tags
- Dispute resolution system
- Mobile app version
- Payment methods beyond Stripe
- Advanced analytics and reporting

---

## Contributing

Feel free to submit issues and enhancement requests!

---

## License

This project is provided as-is for educational purposes.
