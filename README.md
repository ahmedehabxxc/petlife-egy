# PetLife (Backend + Frontend)

This repo contains:

- **Backend**: ASP.NET Core Web API (`petLifeApp-master`)
- **Frontend**: Vite + React (`Frontend/petlife-connect-45-main`)

## Important: avoid losing code in Visual Studio

GitHub `main` must stay on the **restore** commit (`7bed4dd` or later). Do **not** pull or reset to the old `97ea97f` (`bugs remove`) commit — that version deleted features.

In Visual Studio: use **Git > Fetch** before **Pull**, and prefer **View > Git Changes** to review updates. If prompted to sync, confirm you are not reverting to `bugs remove`.

## Run in development (recommended)

### 1) Start the backend API

From the repo root:

```powershell
cd "C:\Users\freddy hani\OneDrive\Desktop\Grad Project\petLifeApp-master"
dotnet run
```

- API base URL: `http://localhost:5270/api`
- Swagger: `http://localhost:5270/swagger`

### 2) Start the frontend (Vite)

In a second terminal:

```powershell
cd "C:\Users\freddy hani\OneDrive\Desktop\Grad Project\petLifeApp-master\Frontend\petlife-connect-45-main"
npm install
npm run dev
```

Frontend URL: `http://localhost:8080/`

#### How API calls work in dev

- Frontend calls **relative** `"/api"` (see `src/services/api.ts`)
- Vite proxies `"/api"` → `http://localhost:5270` (see `vite.config.ts`)

This avoids CORS issues while developing.

## Build/Publish (backend serves the frontend)

When you **publish** the backend, it will automatically:

1. Run `npm install`
2. Run `npm run build`
3. Copy `Frontend/petlife-connect-45-main/dist/*` into the backend publish `wwwroot`

Then the backend can serve the React app at `/` and the API at `/api`.

## Supabase configuration

Supabase settings are read from:

- `appsettings.Development.json` (for local dev), or
- environment variables:
  - `Supabase__Url`
  - `Supabase__AnonKey`

