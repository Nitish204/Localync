import { useEffect, useMemo, useState } from "react";
import { productApi } from "../lib/api";

export default function Compare() {
  const [all, setAll] = useState([]);
  const [pickedIds, setPickedIds] = useState([]);

  useEffect(() => {
    productApi.list().then(setAll);
  }, []);

  const picked = pickedIds.map((id) => all.find((p) => p.id === id)).filter(Boolean);

  const verdicts = useMemo(() => {
    if (picked.length < 2) return null;
    const bestValue = [...picked].sort((a, b) => b.score_value - a.score_value)[0];
    const bestPerf = [...picked].sort((a, b) => b.score_performance - a.score_performance)[0];
    const bestLongTerm = [...picked].sort(
      (a, b) => b.score_longevity + b.score_upgradeability - (a.score_longevity + a.score_upgradeability)
    )[0];
    return { bestValue, bestPerf, bestLongTerm };
  }, [picked]);

  function toggle(id) {
    setPickedIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= 3) return ids;
      return [...ids, id];
    });
  }

  const rows = [
    ["Price", (p) => `₹${p.price.toLocaleString("en-IN")}`],
    ["Performance", (p) => `${p.score_performance}/100`],
    ["Value", (p) => `${p.score_value}/100`],
    ["Upgradeability", (p) => `${p.score_upgradeability}/100`],
    ["Repairability", (p) => `${p.score_repairability}/100`],
    ["Longevity", (p) => `${p.score_longevity}/100`],
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Compare</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        A decision, not a spec dump
      </h1>
      <p className="mt-2 text-sm text-subink">Pick up to three products to compare side by side.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {all.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] transition ${
              pickedIds.includes(p.id)
                ? "border-circuit bg-circuit-tint text-circuit"
                : "border-line bg-white text-subink hover:border-ink/40"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {picked.length >= 2 && (
        <>
          <div className="mt-10 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="p-4 text-left font-mono text-[11px] uppercase tracking-wide text-subink">
                    Metric
                  </th>
                  {picked.map((p) => (
                    <th key={p.id} className="p-4 text-left font-display text-[14px] font-semibold text-ink">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, fn]) => (
                  <tr key={label} className="border-b border-line last:border-0">
                    <td className="p-4 font-mono text-[12px] text-subink">{label}</td>
                    {picked.map((p) => (
                      <td key={p.id} className="p-4 font-mono text-[13px] text-ink">
                        {fn(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {verdicts && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Verdict label="Best value" product={verdicts.bestValue} />
              <Verdict label="Best performance" product={verdicts.bestPerf} />
              <Verdict label="Best long-term" product={verdicts.bestLongTerm} />
            </div>
          )}
        </>
      )}

      {picked.length === 1 && (
        <p className="mt-10 text-center text-sm text-subink">Pick one more product to compare.</p>
      )}
    </div>
  );
}

function Verdict({ label, product }) {
  return (
    <div className="rounded-xl border border-line bg-circuit-tint/50 p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">{label}</p>
      <p className="mt-2 font-display text-[15px] font-semibold text-ink">{product.name}</p>
    </div>
  );
}
