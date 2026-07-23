# Xenova

Xenova is a full-stack MERN application that helps students manage their **finances** and **productivity** in one place: track income and expenses against a monthly budget, run Pomodoro-style focus sessions, and log extracurricular activities with certificates — all wrapped in a calm, Linear/Notion-inspired interface.

## Tech stack

**Frontend:** React, React Router, Axios, Tailwind CSS, Recharts, Lucide React
**Backend:** Node.js, Express, MongoDB, Mongoose, JWT (httpOnly cookies), bcryptjs, Multer
**Tooling:** Concurrently, Nodemon

## Project structure

```text
xenova/
├── package.json          # root scripts + backend dependencies
├── server/                # Express API
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   └── uploads/           # uploaded certificates land here
└── client/                # React app
    └── src/
        ├── components/
        ├── pages/
        ├── context/
        └── services/api.js
```

## 1. Prerequisites

- **Node.js** v18 or later ([nodejs.org](https://nodejs.org))
- **MongoDB** — either:
  - a local MongoDB instance (`mongod` running on `127.0.0.1:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and its connection string

## 2. Get the project onto your machine

Copy/clone the `xenova/` folder to your computer, then open a terminal inside it.

## 3. Install dependencies

Install the backend dependencies (from the project root) and the frontend dependencies (inside `client/`):

```bash
# from the xenova/ root
npm install

# frontend dependencies
cd client
npm install
cd ..
```

Or, in one step: `npm run install-all`.

## 4. Configure environment variables

Copy the example env file and fill in your own values:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/xenova     # or your Atlas connection string
JWT_SECRET=replace_this_with_a_long_random_string
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

Never commit `server/.env` — it's already excluded via `.gitignore`.

## 5. Run the app

From the project root:

```bash
npm run dev
```

This starts the Express API and the React dev server together (via `concurrently`).

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001/api

You can also run each side independently:

```bash
npm run server   # Express API only, with nodemon
npm run client   # React dev server only
```

## 6. Create an account

Open http://localhost:3000, click **Create one**, and register. You'll be redirected straight to your dashboard.

## How authentication works

- On register/login, the server signs a JWT and sets it as an **httpOnly cookie** (`token`) — it's never exposed to client-side JavaScript or stored in `localStorage`.
- Axios is configured with `withCredentials: true` so the cookie is sent automatically with every request.
- Protected API routes run through `authMiddleware.js`, which verifies the cookie and attaches the authenticated user to `req.user`.
- Logging out clears the cookie server-side.

## Where certificates are stored

Uploaded certificates (for Activities) are saved to `server/uploads/` on disk and served statically at `http://localhost:5001/uploads/<filename>`. Only PDF, PNG, JPG, and WEBP files up to 5MB are accepted. This folder is git-ignored except for a `.gitkeep` placeholder.

## API overview

| Area | Endpoint | Description |
|---|---|---|
| Auth | `POST /api/auth/register` | Create an account |
| Auth | `POST /api/auth/login` | Log in |
| Auth | `GET /api/auth/me` | Get the current user |
| Auth | `PUT /api/auth/me` | Update name / monthly budget |
| Auth | `POST /api/auth/logout` | Clear the auth cookie |
| Finance | `GET/POST /api/finance/transactions` | List / create transactions |
| Finance | `PUT/DELETE /api/finance/transactions/:id` | Update / delete a transaction |
| Finance | `GET /api/finance/summary` | Income, expenses, budget usage, trends |
| Productivity | `GET/POST /api/productivity/focus-sessions` | List / log Pomodoro sessions |
| Productivity | `GET/POST /api/productivity/activities` | List / create activities (multipart for uploads) |
| Productivity | `PUT/DELETE /api/productivity/activities/:id` | Update / delete an activity |
| Productivity | `GET /api/productivity/summary` | Streak, today's focus minutes, upcoming activities |

All finance and productivity routes are protected and scoped strictly to the authenticated user.

## Troubleshooting

- **"MongoDB connection error"** — make sure `mongod` is running locally, or that your Atlas connection string in `server/.env` is correct and your IP is allow-listed on Atlas.
- **CORS or cookie issues** — confirm `CLIENT_URL` in `server/.env` matches the URL you're opening the app from (`http://localhost:3000` by default).
- **Certificate upload rejected** — only PDF, PNG, JPG, and WEBP under 5MB are accepted.
