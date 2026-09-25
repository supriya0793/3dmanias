import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Check,
  Instagram,
  MessageCircle,
  MonitorPlay,
  Sparkles,
  X,
} from "lucide-react";
import { aboutCreator, course, site } from "./config";
import "./styles.css";

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="3D Manias home">
      <img src="/logo.gif" alt="3D Manias" />
    </a>
  );
}

function buildPaidWhatsAppUrl({ name, email, paymentId }) {
  const lines = [
    `Hi 3D Manias! Payment successful for Recorded AI Archviz Masterclass (${site.coursePrice}).`,
    ``,
    `Full Name: ${name}`,
    `Email ID: ${email}`,
    `Razorpay Payment ID: ${paymentId}`,
    ``,
    `Please confirm course access on Email and WhatsApp.`,
  ];
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PurchaseModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [courseLink, setCourseLink] = useState("");

  const detailsReady = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDone(false);
    setError("");
    setPaymentId("");
    setCourseLink("");
    setPaying(false);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  async function startPayment(event) {
    event.preventDefault();
    if (!detailsReady || paying) return;

    setPaying(true);
    setError("");

    try {
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk || !window.Razorpay) {
        throw new Error("Could not load Razorpay. Check your internet and try again.");
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Could not start payment.");
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: site.brand,
        description: course.title,
        order_id: orderData.orderId,
        prefill: {
          name: name.trim(),
          email: email.trim(),
        },
        theme: { color: "#ff5c14" },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                name: name.trim(),
                email: email.trim(),
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.ok) {
              throw new Error(verifyData.error || "Payment could not be verified.");
            }

            setPaymentId(verifyData.paymentId);
            setCourseLink(verifyData.courseFileLink || "");
            setDone(true);
            setStep(2);
          } catch (verifyErr) {
            setError(verifyErr.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError("Payment was cancelled. Complete payment to unlock the course.");
          },
        },
      });

      rzp.on("payment.failed", (response) => {
        setPaying(false);
        setError(response?.error?.description || "Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      setPaying(false);
      setError(err.message || "Could not open payment.");
    }
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="buy-title">
      <button className="modal-backdrop" onClick={onClose} aria-label="Close purchase window" />
      <div className="modal-panel">
        <header className="modal-head">
          <div>
            <p className="eyebrow">Secure checkout</p>
            <h2 id="buy-title">Buy Masterclass</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="stepper">
          <span className={step >= 1 ? "active" : ""}>1 · Details & pay</span>
          <span className={step >= 2 ? "active" : ""}>2 · Course access</span>
        </div>

        {step === 1 && (
          <form className="modal-body details-form single" onSubmit={startPayment}>
            <p className="price-tag">
              {site.coursePrice}
              <small>{site.coursePriceNote}</small>
            </p>
            <p className="form-lead">
              Enter your details, then pay with Razorpay. Course access unlocks only after payment
              succeeds — not before.
            </p>
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </label>
            <label>
              Email ID
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button
              className="primary-btn"
              type="submit"
              disabled={!detailsReady || paying}
            >
              {paying ? "Opening Razorpay…" : `Pay securely · ${site.coursePrice}`}
              <ArrowRight size={16} />
            </button>
            <p className="form-lead">
              UPI, cards, and netbanking are available inside Razorpay. The pay button stays locked
              until name and email are filled, and course access stays locked until payment is
              successful.
            </p>
          </form>
        )}

        {step === 2 && done && (
          <div className="modal-body success-body">
            <span className="success-mark">
              <Check size={28} />
            </span>
            <h3>Payment successful</h3>
            <p>
              Thank you, <strong>{name}</strong>. Payment ID: <strong>{paymentId}</strong>
            </p>
            <p>
              Course access for <strong>{email}</strong> is unlocked.
            </p>
            {courseLink ? (
              <a className="primary-btn" href={courseLink} target="_blank" rel="noreferrer">
                Download / open course <ArrowRight size={16} />
              </a>
            ) : (
              <p className="hint">
                Payment verified. We will send the course file/link to your Email and WhatsApp
                shortly.
              </p>
            )}
            <a
              className="ghost-btn"
              href={buildPaidWhatsAppUrl({ name, email, paymentId })}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Confirm on WhatsApp
            </a>
            <button className="primary-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [buyOpen, setBuyOpen] = useState(false);

  return (
    <main id="top">
      <header className="nav">
        <Logo />
        <nav>
          <a href="#about">About</a>
          <a href="#course">Course</a>
          <a href="#buy">Buy</a>
        </nav>
        <a className="nav-ig" href={site.instagram} target="_blank" rel="noreferrer">
          <Instagram size={16} /> Instagram
        </a>
      </header>

      <section className="hero">
        <div className="hero-media" aria-hidden="true" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>
            AI Archviz
            <br />
            <em>Masterclass</em>
          </h1>
          <p className="hero-text">{course.tagline}</p>
          <div className="hero-cta">
            <button className="primary-btn" onClick={() => setBuyOpen(true)}>
              Buy now · {site.coursePrice} <ArrowRight size={16} />
            </button>
            <a className="ghost-btn light" href="#course">
              See what you’ll learn
            </a>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-copy">
          <p className="eyebrow">About me & my work</p>
          <h2>
            {aboutCreator.name}
            <br />
            <em>{aboutCreator.role}</em>
          </h2>
          <p>{aboutCreator.bio}</p>
          <ul>
            {aboutCreator.points.map((point) => (
              <li key={point}>
                <Check size={16} /> {point}
              </li>
            ))}
          </ul>
          <a className="text-link" href={site.instagram} target="_blank" rel="noreferrer">
            Follow on Instagram <Instagram size={16} />
          </a>
        </div>
        <div className="about-visual">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85"
            alt="Architectural interior visualisation"
          />
          <div className="about-chip">
            <MonitorPlay size={16} /> Recorded · Learn at your pace
          </div>
        </div>
      </section>

      <section className="course" id="course">
        <div className="course-head">
          <p className="eyebrow light">The masterclass</p>
          <h2>{course.title}</h2>
          <p>{course.about[0]}</p>
          <p>{course.about[1]}</p>
        </div>

        <div className="learn-grid">
          <div className="learn-intro">
            <Sparkles size={18} />
            <h3>What you will learn</h3>
          </div>
          <ul>
            {course.learnings.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="closing">{course.closing}</p>
      </section>

      <section className="buy" id="buy">
        <div className="buy-card">
          <div>
            <p className="eyebrow">Course fee</p>
            <h2>
              {site.coursePrice}
              <small>{site.coursePriceNote}</small>
            </h2>
            <p>
              Pay securely with Razorpay. Course download unlocks only after payment is successful.
            </p>
            <ol>
              {course.howToPurchase.map((stepText) => (
                <li key={stepText}>{stepText}</li>
              ))}
            </ol>
            <p className="closing">{course.contactNote}</p>
          </div>
          <div className="buy-actions">
            <button className="primary-btn large" onClick={() => setBuyOpen(true)}>
              Buy now <ArrowRight size={18} />
            </button>
            <a
              className="ghost-btn"
              href={`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(
                "Hi 3D Manias! I have a question about the Recorded AI Archviz Masterclass."
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
            <a
              className="mail-link"
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={15} /> @3dmanias_
            </a>
          </div>
        </div>
      </section>

      <footer>
        <Logo />
        <p>Create realistic AI-powered architectural visuals — without starting from scratch.</p>
        <div className="footer-links">
          <a href={site.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={18} />
          </a>
          <a
            href={`https://wa.me/${site.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            <MessageCircle size={18} />
          </a>
        </div>
        <small>© {new Date().getFullYear()} 3D Manias. All rights reserved.</small>
      </footer>

      <PurchaseModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
