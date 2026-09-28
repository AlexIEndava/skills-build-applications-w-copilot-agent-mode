# OctoFit Tracker

OctoFit Tracker is a React and Express fitness app for Mergington High. Students can log activities, collect points, join school teams, compare friendly leaderboards, and get workouts recommended for their fitness level and preferences.

## Stack

- React 19, Vite, React Router, Bootstrap, and Lucide icons
- Node.js, Express, TypeScript, and Mongoose
- MongoDB database `octofit_db`

## Run locally

MongoDB should be available at `localhost:27017`. Copy `backend/.env.example` to `backend/.env` and replace `JWT_SECRET` with a long random value. Defaults use API port 8000 and frontend port 5173.

Install dependencies from the repository root:

```sh
npm install --prefix octofit-tracker/backend
npm install --prefix octofit-tracker/frontend
```

Seed the workout catalog:

```sh
npm run seed --prefix octofit-tracker/backend
```

Start these in separate terminals:

```sh
npm run dev --prefix octofit-tracker/backend
npm run dev --prefix octofit-tracker/frontend
```

Open `http://localhost:5173`. The frontend detects the Codespaces port 8000 URL automatically. Set `VITE_API_URL` in `frontend/.env` if the API is hosted elsewhere.

## Checks

```sh
npm run build --prefix octofit-tracker/backend
npm run build --prefix octofit-tracker/frontend
npm run lint --prefix octofit-tracker/frontend
npm run smoke --prefix octofit-tracker/backend
```

The smoke test exercises registration, login, profile updates, team membership and ownership, activity points, personalized workouts, and both leaderboards. It removes the temporary records it creates.

## API

The API listens on port 8000 under `/api`. Registration and login return a bearer token. Profile, team, activity, leaderboard, and workout endpoints require that token. Health is available at `GET /api/health`.