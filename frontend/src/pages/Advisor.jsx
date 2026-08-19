import { useState } from "react";
import { Link } from "react-router-dom";
import { advisorApi } from "../lib/api";

const useCases = [
  { value: "gaming", label: "Gaming", body: "Prioritizes GPU, then CPU." },
  { value: "productivity", label: "Productivity", body: "Prioritizes CPU, RAM, storage." },
  { value: "budget", label: "Budget build", body: "Balanced spend, lowest viable cost." },
];

const statusColor = { ok: "bg-signal-go", warning: "bg-signal-warn", error: "bg-signal-stop" };

export default function Advisor() {
  const [budget, setBudget] = useState(80000);
  const [useCase, setUseCase] = useState("gaming");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await advisorApi.recommend({ budget: Number(budget), use_case: useCase });
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Localync Advisor</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        Tell us your budget. We'll build the rest.
      </h1>
      <p className="mt-2 max-w-lg text-sm text-subink">
        Not a chatbot — a transparent allocation algorithm that spends your budget across
        components by priority, then runs it through the same compatibility engine as the PC
        Builder.
      </p>

      <form onSubmit={submit} className="mt-10 rounded-xl border border-line bg-white p-6">
        <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.12em] text-subink">
          Budget (₹)
        </label>
        <input
          type="number"
          min="10000"
          step="1000"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-circuit"
        />

        <label className="mb-2 mt-5 block font-mono text-[11px] uppercase tracking-[0.12em] text-subink">
          What's it for?
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {useCases.map((u) => (
            <button
              type="button"
              key={u.value}
              onClick={() => setUseCase(u.value)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                useCase === u.value ? "border-circuit bg-circuit-tint" : "border-line bg-white hover:border-ink/30"
              }`}
            >
              <p className="text-[13px] font-medium text-ink">{u.label}</p>
              <p className="text-[11px] text-subink">{u.body}</p>
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-ink py-3.5 text-sm font-medium text-white hover:bg-circuit disabled:opacity-60"
        >
          {loading ? "Building…" : "Recommend a build"}
        </button>
      </form>

      {result && (
        <div className="mt-8 rounded-xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Recommended build</p>
            <span className="font-mono text-sm text-ink">₹{result.estimated_total.toLocaleString("en-IN")}</span>
          </div>
          <p className="mt-3 text-sm text-ink">{result.message}</p>

          <div className="mt-5 divide-y divide-line">
            {result.components.map((c) => (
              <Link
                key={c.product.id}
                to={`/product/${c.product.id}`}
                className="flex items-center justify-between py-3 hover:text-circuit"
              >
                <div>
                  <p className="font-mono text-[11px] uppercase text-subink">{c.category}</p>
                  <p className="font-display text-[14px] font-semibold">{c.product.name}</p>
                </div>
                <span className="font-mono text-sm">₹{c.product.price.toLocaleString("en-IN")}</span>
              </Link>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-subink">
              Compatibility — {result.compatibility.score}/100
            </p>
            <div className="mt-3 space-y-2">
              {result.compatibility.checks.map((c) => (
                <div key={c.label} className="flex items-start gap-2 font-mono text-[12px]">
                  <span className={`mt-1 status-dot ${statusColor[c.status]}`} />
                  <div>
                    <p className="text-ink">{c.label}</p>
                    <p className="text-subink">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
