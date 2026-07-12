# TransitOps - Smart Transport Operations Platform

A full-stack MERN application for managing fleet operations, drivers, trips, maintenance, fuel, and expenses.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts + Socket.io + Leaflet
- **Backend**: Node.js + Express + Socket.io
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Real-time**: WebSocket (Socket.io)
- **Map**: Leaflet + React-Leaflet
- **UI**: Lucide React icons, React Hot Toast

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd TransitOps

# Install root dependencies
npm install

# Install all server and client dependencies
npm run install:all
```

### Environment Variables

Create `.env` in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Client
VITE_API_URL=http://localhost:5000/api
```

### Seed Data

```bash
# Seed the database with sample data
npm run seed
```

This creates:
- 3 users (admin, dispatcher, viewer)
- 10 vehicles
- 8 drivers
- 15 trips (completed, in-progress, scheduled, cancelled)
- 7 maintenance records
- 10 fuel logs
- 10 expense records

### Development

```bash
# Run both server and client
npm run dev

# Run server only
npm run server

# Run client only
npm run client
```

The server runs on `http://localhost:5000` and the client on `http://localhost:3000`.

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@transitops.com | admin123 |
| Dispatcher | dispatcher@transitops.com | dispatcher123 |
| Viewer | viewer@transitops.com | viewer123 |

## Project Structure

```
TransitOps/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── Layout.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── VehicleForm.jsx
│   │   │   ├── VehicleDetail.jsx
│   │   │   ├── DriverForm.jsx
│   │   │   ├── DriverDetail.jsx
│   │   │   ├── TripForm.jsx
│   │   │   ├── TripDetail.jsx
│   │   │   ├── MaintenanceForm.jsx
│   │   │   ├── MaintenanceDetail.jsx
│   │   │   ├── FuelForm.jsx
│   │   │   └── ExpenseForm.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Vehicles.jsx
│   │   │   ├── Drivers.jsx
│   │   │   ├── Trips.jsx
│   │   │   ├── LiveTracking.jsx
│   │   │   ├── Maintenance.jsx
│   │   │   ├── FuelExpenses.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── utils/
│   │   │   └── leafletFix.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── ...
├── server/                     # Express backend
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Driver.js
│   │   ├── Trip.js
│   │   ├── Maintenance.js
│   │   ├── FuelLog.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vehicles.js
│   │   ├── drivers.js
│   │   ├── trips.js
│   │   ├── maintenance.js
│   │   ├── fuel.js
│   │   ├── expenses.js
│   │   ├── reports.js
│   │   ├── tracking.js
│   │   └── health.js
│   ├── utils/
│   │   └── socket.js
│   ├── seed.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| PUT | `/api/auth/password` | Change password | Yes |
| GET | `/api/auth/users` | List users (admin) | Admin |
| PUT | `/api/auth/users/:id/role` | Change user role | Admin |
| PUT | `/api/auth/users/:id/status` | Toggle user active | Admin |

### Vehicles
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/vehicles` | List vehicles | Yes |
| GET | `/api/vehicles/:id` | Get vehicle | Yes |
| POST | `/api/vehicles` | Create vehicle | Admin/Dispatcher |
| PUT | `/api/vehicles/:id` | Update vehicle | Admin/Dispatcher |
| DELETE | `/api/vehicles/:id` | Delete vehicle | Admin/Dispatcher |

### Drivers
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/drivers` | List drivers | Yes |
| GET | `/api/drivers/:id` | Get driver | Yes |
| GET | `/api/drivers/:id/dispatch-check` | Check dispatch eligibility | Yes |
| POST | `/api/drivers` | Create driver | Admin/Dispatcher |
| PUT | `/api/drivers/:id` | Update driver | Admin/Dispatcher |
| DELETE | `/api/drivers/:id` | Delete driver | Admin/Dispatcher |

### Trips
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/trips` | List trips | Yes |
| GET | `/api/trips/:id` | Get trip | Yes |
| POST | `/api/trips` | Schedule trip | Admin/Dispatcher |
| PUT | `/api/trips/:id` | Edit scheduled trip | Admin/Dispatcher |
| PUT | `/api/trips/:id/dispatch` | Dispatch trip | Admin/Dispatcher |
| PUT | `/api/trips/:id/complete` | Complete trip | Admin/Dispatcher |
| PUT | `/api/trips/:id/cancel` | Cancel trip | Admin/Dispatcher |
| DELETE | `/api/trips/:id` | Delete trip | Admin/Dispatcher |

### Maintenance
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/maintenance` | List records | Yes |
| GET | `/api/maintenance/:id` | Get record | Yes |
| POST | `/api/maintenance` | Schedule maintenance | Admin/Dispatcher |
| PUT | `/api/maintenance/:id` | Update record | Admin/Dispatcher |
| DELETE | `/api/maintenance/:id` | Delete record | Admin/Dispatcher |

### Fuel
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/fuel` | List fuel logs | Yes |
| GET | `/api/fuel/:id` | Get fuel log | Yes |
| POST | `/api/fuel` | Add fuel log | Admin/Dispatcher |
| PUT | `/api/fuel/:id` | Update fuel log | Admin/Dispatcher |
| DELETE | `/api/fuel/:id` | Delete fuel log | Admin/Dispatcher |

### Expenses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/expenses` | List expenses | Yes |
| GET | `/api/expenses/:id` | Get expense | Yes |
| POST | `/api/expenses` | Add expense | Admin/Dispatcher |
| PUT | `/api/expenses/:id` | Update expense | Admin/Dispatcher |
| DELETE | `/api/expenses/:id` | Delete expense | Admin/Dispatcher |

### Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/dashboard` | Dashboard summary | Yes |
| GET | `/api/reports/fleet-utilization` | Fleet utilization data | Yes |
| GET | `/api/reports/fuel-efficiency` | Fuel efficiency by vehicle | Yes |
| GET | `/api/reports/operational-cost` | Operational cost breakdown | Yes |
| GET | `/api/reports/vehicle-roi` | Vehicle ROI analysis | Yes |
| GET | `/api/reports/csv/:type` | Export CSV (vehicles/trips/fuel/expenses/maintenance) | Yes |

### Live Tracking
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tracking` | Get all vehicle locations | Yes |
| PUT | `/api/tracking/:vehicleId` | Update vehicle location | Yes |
| POST | `/api/tracking/simulate` | Simulate vehicle movement | Yes |

### WebSocket Events (Socket.io)
| Event | Direction | Description |
|-------|-----------|-------------|
| `join:tracking` | Client → Server | Join tracking room |
| `join:dashboard` | Client → Server | Join dashboard room |
| `join:trips` | Client → Server | Join trips room |
| `vehicle:location` | Server → Client | Vehicle position update |
| `vehicle:added` | Server → Client | New vehicle added |
| `vehicle:updated` | Server → Client | Vehicle status changed |
| `trip:created` | Server → Client | New trip scheduled |
| `trip:dispatched` | Server → Client | Trip dispatched |
| `trip:completed` | Server → Client | Trip completed |
| `trip:cancelled` | Server → Client | Trip cancelled |
| `dashboard:update` | Server → Client | Dashboard data refreshed |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |

## Business Rules

- Vehicle registration number must be unique (Indian format: XX-XX-XXXX-XXXXX)
- Vehicle in maintenance (in_shop) cannot be dispatched
- Retired vehicles cannot be dispatched
- Expired driver license cannot dispatch
- Suspended drivers cannot dispatch
- Driver already on trip cannot dispatch
- Vehicle already on trip cannot dispatch
- Cargo weight cannot exceed vehicle capacity
- Dispatch sets vehicle and driver to "On Trip"
- Complete Trip sets vehicle and driver to "Available"
- Cancel Trip sets vehicle and driver to "Available"
- Start Maintenance sets vehicle to "In Shop"
- Close Maintenance sets vehicle to "Available"

## Features

- **Dashboard**: Real-time fleet overview with live stats and charts
- **Vehicle Management**: Full CRUD with status tracking
- **Driver Management**: License tracking, expiry alerts, dispatch eligibility
- **Trip Management**: Schedule, dispatch, complete, cancel workflow
- **Live Fleet Tracking**: Real-time vehicle positions on an interactive map
- **WebSocket Updates**: Instant status changes across all connected clients
- **Maintenance**: Schedule and track vehicle maintenance with cost tracking
- **Fuel & Expenses**: Track fuel consumption and operational expenses
- **Reports**: Fleet utilization, fuel efficiency, ROI, operational costs
- **CSV Export**: Export vehicles, trips, fuel logs, expenses, maintenance
- **Role-Based Access**: Admin, Dispatcher, Driver, Viewer roles
- **JWT Authentication**: Secure token-based auth with refresh
- **Real-time Notifications**: Toast notifications for all status changes

## License

MIT
