# TransitOps - Smart Transport Operations Platform

A full-stack MERN application for managing fleet operations, drivers, trips, maintenance, fuel, and expenses.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Install root dependencies
npm install

# Install all server and client dependencies
npm run install:all
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

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

## Project Structure

```
TransitOps/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── App.jsx          # Main app with routing
│   │   └── index.css        # Tailwind styles
│   └── ...
├── server/                  # Express backend
│   ├── config/              # DB config
│   ├── middleware/           # Error handling
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   └── server.js            # Entry point
├── .env                     # Environment variables
├── .env.example             # Env template
├── .gitignore
├── package.json             # Root package.json
└── README.md
```

## API Endpoints

### Health Check

- `GET /api/health` - Server health check

## License

MIT
