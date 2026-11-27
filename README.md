# YouTube Chat

YouTube Chat lets you index a video's transcript and ask questions with clickable timestamps and transcript sources. The repository contains a FastAPI backend and a React, Vite, and Tailwind frontend.

## Requirements

- Python 3.10 or newer
- Node.js 18 or newer and npm
- A Groq API key and model name

## Configure environment

The backend reads `GROQ_MODEL`, `GROQ_API_KEY`, and optionally `CORS_ORIGINS` from this folder's `.env` file. Open `.env` and paste the matching values from your repository-level `.env` file. Keep `.env` private; it is excluded by `.gitignore`.

Alternatively, copy `.env.example` to `.env` and fill in the values. The default CORS origin is `http://localhost:5173`.

## Start the backend

In PowerShell, from the project folder:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Set-Location backend
uvicorn main:app --reload --port 8000
```

The backend API is available at `http://localhost:8000`.

## Start the frontend

Open a second terminal in the project folder:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The frontend defaults to the backend at `http://localhost:8000`. To change it, create `frontend/.env.local` containing:

```env
VITE_API_URL=http://localhost:8000
```

## Build the frontend

From `frontend/`, run `npm run build`. The production output is written to `frontend/dist/` and is ignored by Git.

## GitHub checklist

Commit the source, `frontend/package-lock.json`, and both dependency manifests. Do not commit `.env`, API keys, virtual environments, `node_modules`, build output, or transcript cache files. Start a repository from this folder with `git init` if this project is not already tracked separately.
