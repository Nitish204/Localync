import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../lib/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { login, status, error } = useAuthStore();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate("/marketplace");
  }

  return (
    <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 md:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Welcome back</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">Log in to Localync</h1>
          <p className="mt-2 text-sm text-subink">
            New here?{" "}
            <Link to="/register" className="text-circuit underline underline-offset-4">
              Create an account
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-9 space-y-5">
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-circuit focus:ring-2 focus:ring-circuit/15"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-line bg-white px-4 py-3 pr-16 text-sm outline-none transition focus:border-circuit focus:ring-2 focus:ring-circuit/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wide text-subink hover:text-ink"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-lg bg-signal-stop/10 px-4 py-2.5 text-sm text-signal-stop">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-white transition hover:bg-circuit disabled:opacity-60"
            >
              {status === "loading" ? "Verifying…" : "Log in"}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-circuit-tint/60 px-4 py-3">
            <span className="mt-0.5 status-dot bg-circuit" />
            <p className="font-mono text-[11px] leading-relaxed text-subink">
              Passwords are hashed with bcrypt before storage — Localync never
              keeps, transmits, or displays your password in plain text.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right: schematic panel */}
      <AuthSidePanel />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-subink">
        {label}
      </span>
      {children}
    </label>
  );
}

export function AuthSidePanel() {
  return (
    <div className="hidden items-center justify-center border-l border-line bg-white bg-grid md:flex">
      <div className="bracket-frame w-[300px] rounded-lg bg-panel p-6 shadow-soft">
        <span className="bracket-tr" />
        <span className="bracket-bl" />
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">
          Session security
        </p>
        <div className="mt-5 space-y-3 font-mono text-[12px]">
          <Row label="Hashing" value="bcrypt, cost 12" ok />
          <Row label="Storage" value="hash only, no plaintext" ok />
          <Row label="Session" value="signed JWT, 24h expiry" ok />
          <Row label="Transport" value="Bearer token over HTTPS" ok />
        </div>
        <p className="mt-6 text-[13px] leading-relaxed text-subink">
          Every account, whether customer, vendor, technician or admin,
          authenticates through the same hardened path — no role gets a
          shortcut.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, ok }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-subink">
        <span className={`status-dot ${ok ? "bg-signal-go" : "bg-signal-warn"}`} />
        {label}
      </span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
