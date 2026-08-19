import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../lib/authStore";
import { AuthSidePanel } from "./Login";

const roles = [
  { value: "customer", label: "Customer", body: "Browse, compare, build, order." },
  { value: "vendor", label: "Vendor", body: "List inventory, manage local orders." },
  { value: "technician", label: "Technician", body: "Take repair & upgrade requests." },
];

function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthMeta = [
  { label: "Too short", color: "bg-signal-stop" },
  { label: "Weak", color: "bg-signal-stop" },
  { label: "Okay", color: "bg-signal-warn" },
  { label: "Good", color: "bg-signal-go" },
  { label: "Strong", color: "bg-signal-go" },
];

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const { register, status, error } = useAuthStore();
  const navigate = useNavigate();

  const strength = useMemo(() => scorePassword(password), [password]);

  async function onSubmit(e) {
    e.preventDefault();
    const ok = await register({ name, email, password, role });
    if (ok) navigate("/marketplace");
  }

  return (
    <div className="grid min-h-[calc(100vh-73px)] grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Get started</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-subink">
            Already have one?{" "}
            <Link to="/login" className="text-circuit underline underline-offset-4">
              Log in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-subink">
                I'm joining as
              </span>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition ${
                      role === r.value
                        ? "border-circuit bg-circuit-tint"
                        : "border-line bg-white hover:border-ink/30"
                    }`}
                  >
                    <p className="text-xs font-medium text-ink">{r.label}</p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-subink">
                {roles.find((r) => r.value === role)?.body}
              </p>
            </div>

            <Field label="Full name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-circuit focus:ring-2 focus:ring-circuit/15"
              />
            </Field>

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
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters, 1 letter, 1 number"
                className="w-full rounded-lg border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-circuit focus:ring-2 focus:ring-circuit/15"
              />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < strength ? strengthMeta[strength].color : "bg-line"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-subink">
                    {strengthMeta[strength].label} — hashed with bcrypt before it ever touches the database.
                  </p>
                </div>
              )}
            </Field>

            {error && (
              <p className="rounded-lg bg-signal-stop/10 px-4 py-2.5 text-sm text-signal-stop">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-white transition hover:bg-circuit disabled:opacity-60"
            >
              {status === "loading" ? "Creating account…" : "Create account"}
            </button>
          </form>
        </motion.div>
      </div>

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
