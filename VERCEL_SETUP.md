# Vercel 404 Fix — Critical Settings

If the site returns 404, check these in **Vercel Dashboard** → **yacunaj-menu** → **Settings** → **General**:

| Setting | Must Be |
|--------|---------|
| **Root Directory** | *(leave EMPTY or `.`)* — NOT `frontend/` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Framework** | Vite |

**Why:** The project is restructured — `src/`, `api/`, and `package.json` live at the **project root**. If Root Directory is `frontend/`, Vercel builds only that folder and the `api/` serverless functions are not deployed.

**Environment Variables** (Settings → Environment Variables) for Production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
