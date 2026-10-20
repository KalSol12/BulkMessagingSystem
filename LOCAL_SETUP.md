# Local Development Setup

This guide shows how to run the Bulk Messaging System locally on your machine.

## Prerequisites

- .NET 10.0 SDK
- Node.js 18+ and npm
- PostgreSQL database (local or Docker)

## Backend Setup

1. Navigate to the backend project:
```powershell
cd backend\BulkMessaging.API
```

2. Restore dependencies and build:
```powershell
dotnet restore
dotnet build
```

3. Configure the database connection in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=bulk_messaging_db;Username=postgres;Password=your_password"
  }
}
```

4. Run the backend API:
```powershell
dotnet run
```

The API will start on `http://localhost:5101`

**Note:** The JWT signing key and CORS settings are already configured in `appsettings.Development.json` for local development.

## Frontend Setup

1. Navigate to the frontend project:
```powershell
cd frontend\bulk-messaging-ui
```

2. Install dependencies:
```powershell
npm install
```

3. Run the frontend development server:
```powershell
npm run dev
```

The frontend will start on `http://localhost:5173`

**Note:** The frontend is configured to proxy API requests to the backend at `http://localhost:5101` via Vite's proxy configuration.

## Database Setup

### Option 1: Local PostgreSQL

Install PostgreSQL locally and create a database:
```sql
CREATE DATABASE bulk_messaging_db;
```

Update the connection string in `appsettings.json` with your PostgreSQL credentials.

### Option 2: Docker PostgreSQL

Run PostgreSQL in Docker:
```powershell
docker run --name bulk-messaging-db -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=bulk_messaging_db -p 5432:5432 -d postgres:latest
```

## Initial Admin Account

The application will automatically create an initial admin account on first run with the credentials configured in `appsettings.json`:

- Email: `test@example.com`
- Password: `Administrator@123!`

**Important:** Change these credentials in production!

## Running Both Services

To run both backend and frontend simultaneously:

1. Open two terminal windows
2. In terminal 1, run the backend:
```powershell
cd backend\BulkMessaging.API
dotnet run
```

3. In terminal 2, run the frontend:
```powershell
cd frontend\bulk-messaging-ui
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Troubleshooting

### Backend won't start
- Ensure PostgreSQL is running and accessible
- Check the connection string in `appsettings.json`
- Verify .NET 10.0 SDK is installed

### Frontend can't connect to backend
- Ensure the backend is running on `http://localhost:5101`
- Check that CORS is configured correctly in `appsettings.Development.json`
- Verify the Vite proxy configuration in `vite.config.ts`

### Database migration errors
- The API automatically runs migrations on startup
- If migrations fail, check the database connection and permissions
- You can manually run migrations: `dotnet ef database update`

## Configuration Files

- **Backend:** `backend/BulkMessaging.API/appsettings.json` (base config)
- **Backend Dev:** `backend/BulkMessaging.API/appsettings.Development.json` (local overrides)
- **Frontend:** `frontend/bulk-messaging-ui/vite.config.ts` (dev server & proxy)
- **Frontend API:** `frontend/bulk-messaging-ui/src/api.ts` (API base URL)
