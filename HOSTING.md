# Host 3D Manias for real users

Your site needs **both**:
- the React page (frontend)
- the payment server (Razorpay)

Easiest: host them together on **Render** (free tier available).

---

## Before hosting checklist

1. Upload course RAR to **Google Drive** and copy the share link  
2. In Razorpay Dashboard:
   - Switch to **Live Mode**
   - **Account & Settings → API Keys → Generate Live Key**
   - Save Live Key ID (`rzp_live_...`) + Key Secret
3. Have these ready (do not post secrets in chat):
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `COURSE_FILE_LINK` (Drive link)
   - `COURSE_AMOUNT_PAISE=349900`

---

## Option A — Render (recommended)

### 1. Put code on GitHub
1. Create a GitHub account if needed
2. Create a new private repository
3. Upload / push this project folder  
   (make sure `.env` is NOT uploaded — it is gitignored)

### 2. Create a Render Web Service
1. Go to [https://render.com](https://render.com) → Sign up
2. **New → Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `RAZORPAY_KEY_ID` = your **live** key id
   - `RAZORPAY_KEY_SECRET` = your **live** key secret
   - `COURSE_AMOUNT_PAISE` = `349900`
   - `COURSE_FILE_LINK` = your Google Drive course link
6. Deploy

Render gives you a public HTTPS URL like:
`https://3dmanias-xxxx.onrender.com`

### 3. Put that link in Instagram bio
Use the Render URL as your Instagram link.

### 4. Razorpay live settings
In Razorpay Dashboard (Live Mode):
- Add your website URL under business / website settings if asked
- Ensure UPI / cards are enabled
- Do one small real test payment yourself

---

## Option B — Railway
Same idea as Render:
1. Push to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Add the same environment variables
6. Generate a public domain

---

## After it is live

Share:
- Instagram bio → your hosted URL
- Buyers pay via Razorpay
- Course Drive link unlocks only after successful payment

Optional later:
- Custom domain like `course.3dmanias.com`
- Auto-email the Drive link (needs email service)

---

## Important

- Use **Live** Razorpay keys on the hosted site (not Test keys)
- Never commit `.env` or the `.rar` course file
- Free hosting may sleep after inactivity (first open can be slow) — paid plan keeps it always awake
