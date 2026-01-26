# Saxon Scout Server

A PostgreSQL-based backend server for the Saxon Scout FRC scouting application.

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL connection details:
```
DATABASE_URL=postgresql://saxon_user:saxon_password@localhost:5432/saxon_scout
NODE_ENV=development
PORT=5000
```

4. Initialize the database:
```bash
npm run db:init
```

### Running the Server

Development mode with hot reload:
```bash
npm run dev
```

Production build and run:
```bash
npm run build
npm start
```

## API Endpoints

### Matches
- `GET /api/matches` - Get all matches
- `GET /api/matches/:id` - Get specific match
- `POST /api/matches` - Create or update match
- `DELETE /api/matches/:id` - Delete match

### Pit Data
- `GET /api/pit-data` - Get all pit data
- `GET /api/pit-data/:teamNumber` - Get pit data for team
- `POST /api/pit-data` - Create or update pit data
- `DELETE /api/pit-data/:teamNumber` - Delete pit data

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Bulk create/update teams

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `POST /api/users/verify` - Verify user credentials

### Picklists
- `GET /api/picklists` - Get all picklists
- `POST /api/picklists` - Create/update picklist

## Database Schema

The server creates the following tables:
- `users` - Scout user accounts
- `matches` - Match scouting data
- `pit_data` - Pit scouting data
- `teams` - Team information
- `schedules` - Match schedules
- `picklists` - Team rankings
- `settings` - User settings
- `preferences` - User preferences

## Environment Configuration

Update the React app to use the server by adding to `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```
