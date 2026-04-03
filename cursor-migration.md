# Cursor Migration Guide – Ysho Ghee Shoppe

This document explains how this project is structured, how Lovable.dev integrates with it, how to disconnect Lovable-specific tooling, and how to run the app locally in a standard Node/Cursor development workflow.

---

## 1. High‑level overview of the codebase

- **Tech stack**
  - Vite 5 (`vite.config.ts`)
  - React 18 + TypeScript
  - React Router (`react-router-dom`) for routing
  - React Query (`@tanstack/react-query`) for data fetching state (currently just configured, not heavily used)
  - Tailwind CSS + `tailwindcss-animate`
  - shadcn‑ui components (`components.json`, `src/components/ui/*`)

- **Entry point**
  - `src/main.tsx` mounts the React app into `#root`:
    - Imports `App` from `src/App.tsx`
    - Imports global styles from `src/index.css`

- **Application shell & routing**
  - `src/App.tsx`:
    - Creates a `QueryClient` and wraps the app in `QueryClientProvider`
    - Wraps with `TooltipProvider`
    - Renders:
      - `Toaster` (shadcn toast)
      - `Sonner` (notification/toast)
      - `BrowserRouter` with routes:
        - `/` → `src/pages/Index.tsx`
        - `*` → `src/pages/NotFound.tsx`

- **Pages**
  - `src/pages/Index.tsx`
    - Main marketing/landing page for Ysho Amrut A2 Bilona Ghee
    - Uses shadcn UI components (`Button`, `Card`, `Badge`, etc.)
    - Uses images from `src/assets/*`
    - Sections: header, hero, benefits, process, CTA, contact, footer.
  - `src/pages/NotFound.tsx`
    - Simple 404 page that logs the missing route using `useLocation` + `useEffect`.

- **Styling & design system**
  - Tailwind configuration: `tailwind.config.ts`
  - Global styles: `src/index.css`
  - shadcn config and aliases: `components.json`
    - Aliases (`@` → `./src`, `@/components`, `@/lib`, `@/hooks`, etc.)
  - UI primitives and layout components in `src/components/ui/*` (shadcn‑ui style).

- **Tooling & scripts**
  - `package.json`:
    - Scripts:
      - `npm run dev` → Vite dev server
      - `npm run build` → Vite production build
      - `npm run build:dev` → Vite build in `development` mode
      - `npm run lint` → ESLint
      - `npm run preview` → Vite preview server
    - Dev dependencies include ESLint, TypeScript, Tailwind, Vite, and **Lovable’s `lovable-tagger` plugin**.

---

## 2. Lovable.dev integration points

This project is mostly a standard Vite React app. The only Lovable‑specific pieces are:

1. **Dev dependency in `package.json`**

   ```json
   "devDependencies": {
     ...
     "lovable-tagger": "^1.1.9",
     ...
   }
   ```

2. **Vite plugin in `vite.config.ts`**

   ```ts
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react-swc";
   import path from "path";
   import { componentTagger } from "lovable-tagger";

   export default defineConfig(({ mode }) => ({
     server: {
       host: "::",
       port: 8080,
     },
     plugins: [
       react(),
       mode === "development" && componentTagger(),
     ].filter(Boolean),
     resolve: {
       alias: {
         "@": path.resolve(__dirname, "./src"),
       },
     },
   }));
   ```

- **Purpose**: `lovable-tagger` runs only in development mode to tag components so Lovable.dev can understand and annotate the UI. It does **not** affect production builds or runtime behavior outside Lovable.
- **Impact of removal**: Safe to remove for local development in Cursor or any standard Node environment. You will just lose Lovable’s automatic component tagging in its own UI.

The `README.md` also contains Lovable-centric instructions and URLs, but those are purely documentation and safe to edit or delete.

---

## 3. Step‑by‑step: disconnecting Lovable dependencies

This section gives you a clear checklist to remove Lovable‑specific tooling, while keeping the app working normally.

### 3.1. Remove the Lovable dev dependency

From the project root:

```sh
npm uninstall -D lovable-tagger
```

Alternatively, you can manually remove `"lovable-tagger"` from `devDependencies` in `package.json` and then run:

```sh
npm install
```

### 3.2. Clean up `vite.config.ts`

Edit `vite.config.ts` to remove Lovable imports and plugin usage:

1. **Delete** the Lovable import:

```ts
import { componentTagger } from "lovable-tagger";
```

2. **Remove** the `componentTagger` entry from the `plugins` array.

After cleanup, `vite.config.ts` should look conceptually like:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

> Note: You can keep or change the server host/port as desired. `8080` is the default chosen here.

### 3.3. (Optional) Simplify or rewrite `README.md`

If you no longer rely on Lovable.dev:

- Remove or update references to:
  - Lovable project URLs
  - Lovable deployment instructions
- Replace them with:
  - A short project description
  - Local dev instructions (you can copy from section 4 below)
  - Build/deploy steps (e.g., how you deploy via your own hosting or CI)

This is optional and purely for documentation clarity.

---

## 4. Running the app locally (standard Node/Cursor workflow)

### 4.1. Prerequisites

- **Node.js**: Version 18+ (Node 20 LTS recommended) – Vite 5 and modern tooling expect a fairly recent Node.
- **npm**: Comes with Node. (You can also use `pnpm` or `bun`, but examples here use `npm`.)

> Hint: If you see any Node version errors, check your version with `node -v` and consider using `nvm` to switch to a newer version.

### 4.2. Install dependencies

From the project root:

```sh
cd ysho-ghee-shoppe   # or your cloned folder name
npm install
```

This will install all dependencies defined in `package.json`, including React, Vite, Tailwind, shadcn components, etc.

### 4.3. Start the development server

Run:

```sh
npm run dev
```

By default, based on `vite.config.ts`:

- **Host**: `::` (IPv6 all interfaces) – effectively accessible via `localhost`
- **Port**: `8080`

Open the app in your browser:

- `http://localhost:8080/`

You should see the Ysho Amrut marketing site with:

- Sticky header
- Hero section showcasing the A2 Bilona Ghee
- Benefits, process, CTA, and contact sections.

If you need a different port, you can update the `server.port` in `vite.config.ts` or use Vite CLI flags (`npm run dev -- --port 3000`).

### 4.4. Build for production

To create an optimized production build:

```sh
npm run build
```

This generates static assets in the `dist` directory.

You can locally preview the production build using:

```sh
npm run preview
```

Then open the URL printed in the terminal (typically `http://localhost:4173/`).

### 4.5. Linting

To run ESLint:

```sh
npm run lint
```

This helps keep the TypeScript/React codebase consistent and free of common issues.

---

## 5. How to work effectively in Cursor with this repo

- **Open the project root** (`ysho-ghee-shoppe`) in Cursor.
- Use Cursor’s AI to:
  - Navigate components in `src/components/ui/` and higher‑level sections in `src/pages/Index.tsx`.
  - Refactor layout/sections, update copy, or adjust styling tokens in Tailwind and shadcn components.
- Keep this `cursor-migration.md` file handy:
  - It explains where routing, assets, and providers live.
  - It records how Lovable was previously integrated and that it can safely be removed from `package.json` and `vite.config.ts`.

Once you complete steps in section 3, this project will be fully decoupled from Lovable.dev and behave like a standard Vite + React + TypeScript app, ready to evolve entirely within Cursor or your preferred local tooling.

