# 🌴 Yacunaj Café & Gelato — Menú Digital

QR-based digital ordering system for a tropical-themed café in Mexico. **Yacunaj** means "Love" in Mayan.

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Notifications:** Telegram Bot API
- **Deployment:** Vercel (frontend) / Railway or Render (backend)

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Copy the example env files and fill in your credentials:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase/schema.sql` in the SQL Editor
3. Copy Project URL, anon key, and service_role key to your `.env` files

### 4. Run development servers

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 5. Test the menu

Open: `http://localhost:5173/order?table=1&token=tok_t1_abc123`

Admin panel: `http://localhost:5173/admin`

## Project structure

```
yacunaj-menu/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Express API
├── supabase/          # Database schema
└── README.md
```

## Images

Place these images in `frontend/public/images/` (from your assets):

- `menu_background.jpg` — hero/header background
- `leaf_1.png`, `leaf_2.png` — decorative overlays
- `hero_coffee.jpg` — hero section on menu page
- `coffee_shop_interior.jpg` — header blur
- Category icons and product images as needed

## Deployment

- **Frontend:** Deploy to Vercel. Set `VITE_API_URL` to your backend URL.
- **Backend:** Deploy to Railway or Render. Add all env vars from `backend/.env`.

---

🌴 **YACUNAJ** — Amor en Maya
