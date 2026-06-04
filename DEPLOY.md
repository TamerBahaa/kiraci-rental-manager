# 🚀 Kiracı — Deployment Guide
## Total time: ~15 minutes | Cost: Free

---

## STEP 1 — Create Supabase Database (5 min)

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New project"**
   - Name: `kiracidb`
   - Database password: choose a strong one, save it
   - Region: **Frankfurt** (closest to Turkey)
   - Wait ~2 min for project to be ready
3. Go to **SQL Editor** (left sidebar) → **New query**
4. Copy the entire contents of `supabase/schema.sql` → paste → click **Run**
5. You should see: *"Success. No rows returned"*

### Get your credentials:
- Go to **Settings → API**
- Copy **Project URL** → paste into `.env` as `VITE_SUPABASE_URL`
- Copy **anon/public key** → paste into `.env` as `VITE_SUPABASE_ANON_KEY`

### Create your admin user:
- Go to **Authentication → Users → Add user**
- Email: `your@email.com`
- Password: choose something secure
- Click **Create user**

---

## STEP 2 — Deploy to Vercel (5 min)

### Option A: Vercel (Recommended — 1 click)
1. Push this project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Kiracı rental manager"
   # Create repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/kiraci.git
   git push -u origin main
   ```
2. Go to **https://vercel.com** → Sign up with GitHub
3. Click **"Import Project"** → select your repo
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy** → Done!

### Option B: Netlify
1. Run `npm run build` locally
2. Go to **https://netlify.com** → Drag & drop the `dist/` folder
3. Go to **Site settings → Environment variables** → add both env vars
4. Trigger a new deploy

---

## STEP 3 — First Login & Data Import

1. Open your deployed URL
2. Sign in with the email/password you created in Supabase
3. You'll see the **"Import All Data"** banner on the dashboard
4. Click it — all 25 units, 11 owners, 21 tenants and contracts load automatically!

---

## Summary of what was imported from your Excel sheet

| Owner | Units | Monthly Rent |
|-------|-------|-------------|
| MAHMOUD MARE | 5 units (B89, B149, C97, B22, C169) | ₺106,000 + $450 |
| MOHAMED SADAKA | 4 units (B14, B161, A152, A361) | ₺82,500 |
| AHMED ELHELW | 2 units (C119, A265) | ₺32,500 |
| AYMAN FOUAD | 4 units (B173, A595, NLOGO183, A240) | ₺66,500 |
| OMAR ADEL | 1 unit (B130) + A390 vacant | ₺22,000 |
| EMAN ADEL | 1 unit (A391) | ₺13,000 |
| NASSER HAMOUD | 2 units (C134, C63) | ₺41,000 |
| TAMER BAHAA | 1 unit (A367) | ₺13,000 |
| AHMED SAMY | 3 units (A212 + B83, C175 — problem tenants) | ₺15,000 active |
| YOUSSEF FOUAD | 1 unit (A364) | ₺14,000 |

**⚠️ Note:** B83 and C175 (AHMED SAMY) are flagged as non-paying in the data.

---

## Local development
```bash
npm install
# Add your keys to .env
npm run dev
```
