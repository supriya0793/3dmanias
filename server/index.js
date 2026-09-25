import "dotenv/config";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import Razorpay from "razorpay";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const app = express();
const PORT = process.env.PORT || 8787;
const COURSE_AMOUNT_PAISE = Number(process.env.COURSE_AMOUNT_PAISE || 349900); // ₹3,499
const COURSE_FILE_LINK = process.env.COURSE_FILE_LINK || "";

app.use(cors({ origin: true }));
app.use(express.json());

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env");
  }
  return { key_id, key_secret, client: new Razorpay({ key_id, key_secret }) };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    courseLinkConfigured: Boolean(COURSE_FILE_LINK),
  });
});

app.post("/api/create-order", async (req, res) => {
  try {
    const { name, email } = req.body || {};
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: "Name and email are required before payment." });
    }

    const { key_id, client } = getRazorpay();
    const order = await client.orders.create({
      amount: COURSE_AMOUNT_PAISE,
      currency: "INR",
      receipt: `archviz_${Date.now()}`,
      notes: {
        course: "Recorded AI Archviz Masterclass",
        buyer_name: name.trim(),
        buyer_email: email.trim(),
      },
    });

    res.json({
      keyId: key_id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("create-order failed:", error);
    res.status(500).json({
      error: error.message || "Could not create payment order.",
    });
  }
});

app.post("/api/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields." });
    }

    const { key_secret } = getRazorpay();
    const expected = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ ok: false, error: "Payment verification failed." });
    }

    res.json({
      ok: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      name: name || "",
      email: email || "",
      courseFileLink: COURSE_FILE_LINK || null,
      message:
        COURSE_FILE_LINK
          ? "Payment verified. Course link unlocked."
          : "Payment verified. Add COURSE_FILE_LINK to unlock Drive link automatically.",
    });
  } catch (error) {
    console.error("verify-payment failed:", error);
    res.status(500).json({ error: error.message || "Verification error." });
  }
});

// Production: serve the built React site from the same server
app.use(express.static(distDir));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`3D Manias app on http://localhost:${PORT}`);
});
