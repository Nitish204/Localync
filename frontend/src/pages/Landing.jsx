import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const pillars = [
  {
    tag: "01 · Discover",
    title: "A marketplace that actually knows its inventory",
    body: "Browse curated electronics and everyday goods, sorted by what matters — not just what's sponsored.",
  },
  {
    tag: "02 · Understand",
    title: "Every product comes with a verdict, not just a spec sheet",
    body: "Performance, value, upgradeability, repairability and longevity — scored, explained, in plain language.",
  },
  {
    tag: "03 · Maintain",
    title: "Keep what you own working longer",
    body: "Upgrade paths and repair options for the products you've already bought, not just the ones you haven't.",
  },
  {
    tag: "04 · Buy Local",
    title: "See what's on the shelf two streets away",
    body: "Toggle to nearby vendors and pick up today, instead of waiting three days for a warehouse.",
  },
];

const checks = [
  { label: "CPU Socket", status: "go", detail: "Compatible" },
  { label: "RAM Type", status: "go", detail: "Compatible" },
  { label: "GPU Clearance", status: "go", detail: "Compatible" },
  { label: "PSU Headroom", status: "warn", detail: "180W headroom" },
];

const statusColor = { go: "bg-signal-go", warn: "bg-signal-warn", stop: "bg-signal-stop" };

export default function Landing() {
  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden border-b border-line bg-grid bg-grid">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-circuit">
              Intelligent commerce, Hyderabad and beyond
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink md:text-6xl">
              Buy with
              <br />
              intelligence.
            </h1>
            <p className="mt-6 max-w-md text-lg text-subink">
              Products aren't just things you purchase. Understand them, compare
              them, build with them, and keep them running longer.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/marketplace"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-circuit"
              >
                Explore marketplace
              </Link>
              <Link
                to="/pc-builder"
                className="rounded-full border border-line bg-white px-6 py-3 text-sm font-medium text-ink transition hover:border-circuit hover:text-circuit"
              >
                Build a PC
              </Link>
            </div>
          </motion.div>

          {/* Signature element: schematic-style product intelligence card */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="justify-self-center md:justify-self-end"
          >
            <div className="bracket-frame w-[320px] rounded-lg bg-panel p-6 shadow-soft">
              <span className="bracket-tr" />
              <span className="bracket-bl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-base font-semibold">RTX 5070</p>
                  <p className="font-mono text-2xl font-medium text-ink">₹54,999</p>
                </div>
                <span className="rounded-full bg-signal-go/10 px-2 py-1 font-mono text-[11px] text-signal-go">
                  ↓ price trend
                </span>
              </div>

              <div className="mt-5 space-y-2.5 border-t border-line pt-4">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-center justify-between font-mono text-[12px]">
                    <span className="flex items-center gap-2 text-subink">
                      <span className={`status-dot ${statusColor[c.status]}`} />
                      {c.label}
                    </span>
                    <span className="text-ink">{c.detail}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-[12px] text-subink">
                <span>Upgrade potential</span>
                <span className="text-ink">High</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[12px] text-subink">
                <span>Local availability</span>
                <span className="text-ink">3 vendors nearby</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Pillars ---------- */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">The four pillars</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight text-ink">
          Amazon helps you buy. Localync helps you decide.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.tag} className="bg-panel p-8 transition hover:bg-circuit-tint">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">{p.tag}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-subink">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Feature strip ---------- */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-3">
            <Feature
              eyebrow="Price Intelligence"
              title="Know if today is a good day to buy"
              body="30/90/180-day price history with a plain verdict: buy now, or wait."
              to="/marketplace"
            />
            <Feature
              eyebrow="PC Builder"
              title="We check compatibility as you build"
              body="Socket, RAM generation, PSU headroom and case clearance, validated live."
              to="/pc-builder"
            />
            <Feature
              eyebrow="Compare"
              title="A decision, not a spreadsheet"
              body="Best value, best performance, best long-term — called out clearly."
              to="/compare"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Shop smarter. Build better. Buy locally.
        </h2>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-full bg-circuit px-7 py-3.5 text-sm font-medium text-white transition hover:bg-circuit-dark"
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}

function Feature({ eyebrow, title, body, to }) {
  return (
    <Link to={to} className="group block">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">{eyebrow}</p>
      <h3 className="mt-3 font-display text-lg font-semibold text-ink group-hover:text-circuit">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-subink">{body}</p>
      <span className="mt-4 inline-block font-mono text-xs text-ink underline decoration-line underline-offset-4 group-hover:decoration-circuit">
        Explore →
      </span>
    </Link>
  );
}
