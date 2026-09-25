# Next steps after Razorpay login + KYC

## 1. Generate API Keys

1. Open [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Top switch: start with **Test Mode** (toggle)
3. Go to **Account & Settings → API Keys**
4. Click **Generate Key**
5. Copy:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (shown once — save it)

## 2. Put keys in your project

```bash
cp .env.example .env
```

Edit `.env` and paste Key ID + Key Secret.

Optional: paste your Google Drive course link as `COURSE_FILE_LINK=...`
(shown to buyers only after payment succeeds).

## 3. Run the site + payment server

```bash
npm install
npm run dev
```

Open http://localhost:5173

## 4. Test a payment

In Test Mode, Razorpay provides test UPI / cards.
Complete a test payment — only then should course access unlock.

## 5. Go Live

1. Dashboard → switch to **Live Mode**
2. Generate **Live** API Keys (`rzp_live_...`)
3. Replace values in `.env`
4. Host the site + server on HTTPS (Vercel/Railway/etc.)

## Payment flow on your page

1. Buyer enters Name + Email
2. Clicks **Pay securely**
3. Razorpay Checkout opens (UPI / card / netbanking)
4. Only after successful payment → course link + WhatsApp unlock
