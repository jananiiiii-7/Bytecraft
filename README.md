# Bytecraft OS

## Project info

**Local development**

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/jananiiiii-7/Bytecraft.git

# Step 2: Navigate to the project directory.
cd Bytecraft

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

You can work in any Git-compatible environment (local machine, Codespaces, etc.) as you would with a typical Vite/React project.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

You can deploy Bytecraft OS to any static hosting provider that supports Vite builds (for example, Vercel, Netlify, Cloudflare Pages, or GitHub Pages).  
Run `npm run build` and follow your provider’s instructions for deploying the generated `dist` directory.

## Full-stack local development

ByteCraft V1 uses a Vite frontend and an Express backend. Copy `.env.example` to `.env` for frontend-safe Supabase values, and copy `server/.env.example` to `server/.env` for backend-only values. Never expose `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in frontend environment variables.

Install all dependencies and run the complete local stack:

```sh
npm install
npm run dev
```

The frontend runs on `http://localhost:8080`, the backend runs on `http://localhost:3000`, and the Vite `/api` proxy forwards to the backend. Useful commands are:

```sh
npm run build
npm run test
npm run build:client
npm run build:server
npm run test:client
npm run test:server
```

The backend health endpoint is available at `http://localhost:3000/health` and through the frontend proxy at `http://localhost:8080/api/health` once the canonical `/api/health` route is added.
