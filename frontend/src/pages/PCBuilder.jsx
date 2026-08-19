import { useEffect, useMemo, useState } from "react";
import { productApi, builderApi } from "../lib/api";

const slots = [
  { slug: "cpu", label: "CPU" },
  { slug: "motherboard", label: "Motherboard" },
  { slug: "ram", label: "RAM" },
  { slug: "gpu", label: "GPU" },
  { slug: "storage", label: "Storage" },
  { slug: "psu", label: "PSU" },
  { slug: "case", label: "Case" },
];

const statusColor = {
  ok: "bg-signal-go",
  warning: "bg-signal-warn",
  error: "bg-signal-stop",
};

export default function PCBuilder() {
  const [catalog, setCatalog] = useState({});
  const [selected, setSelected] = useState({});
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Promise.all(slots.map((s) => productApi.list({ category: s.slug }))).then((lists) => {
      const map = {};
      slots.forEach((s, i) => (map[s.slug] = lists[i]));
      setCatalog(map);
    });
  }, []);

  const selectedIds = useMemo(
    () => Object.values(selected).filter(Boolean).map((p) => p.id),
    [selected]
  );

  useEffect(() => {
    if (selectedIds.length === 0) {
      setResult(null);
      return;
    }
    setChecking(true);
    builderApi
      .check(selectedIds)
      .then(setResult)
      .finally(() => setChecking(false));
  }, [selectedIds.join(",")]);

  const total = Object.values(selected).reduce((sum, p) => sum + (p?.price || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">PC Builder</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        Build your machine. We'll check the rest.
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Slot pickers */}
        <div className="space-y-4 lg:col-span-2">
          {slots.map((slot) => (
            <SlotPicker
              key={slot.slug}
              slot={slot}
              options={catalog[slot.slug] || []}
              value={selected[slot.slug]}
              onChange={(product) => setSelected((s) => ({ ...s, [slot.slug]: product }))}
            />
          ))}
        </div>

        {/* Compatibility readout */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bracket-frame rounded-xl bg-panel p-6 shadow-soft">
            <span className="bracket-tr" />
            <span className="bracket-bl" />
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">
              Compatibility Score
            </p>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-5xl font-bold text-ink">
                {checking ? "…" : result?.score ?? "—"}
              </span>
              <span className="font-mono text-sm text-subink">/ 100</span>
            </div>

            <div className="mt-6 space-y-2.5">
              {result?.checks?.map((c) => (
                <div key={c.label} className="flex items-start gap-2 font-mono text-[12px]">
                  <span className={`mt-1 status-dot ${statusColor[c.status]}`} />
                  <div>
                    <p className="text-ink">{c.label}</p>
                    <p className="text-subink">{c.detail}</p>
                  </div>
                </div>
              ))}
              {!result && (
                <p className="font-mono text-[12px] text-subink">
                  Pick a few components to see live compatibility checks.
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-4 font-mono text-[12px]">
              <span className="text-subink">Estimated total</span>
              <span className="text-ink">₹{total.toLocaleString("en-IN")}</span>
            </div>
            {result && (
              <div className="mt-1.5 flex items-center justify-between font-mono text-[12px]">
                <span className="text-subink">Estimated power draw</span>
                <span className="text-ink">{result.estimated_wattage} W</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlotPicker({ slot, options, value, onChange }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-subink">{slot.label}</p>
        {value && (
          <button onClick={() => onChange(null)} className="font-mono text-[11px] text-subink hover:text-signal-stop">
            Remove
          </button>
        )}
      </div>

      {value ? (
        <div className="mt-2 flex items-center justify-between">
          <p className="font-display text-[15px] font-semibold text-ink">{value.name}</p>
          <p className="font-mono text-sm text-ink">₹{value.price.toLocaleString("en-IN")}</p>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange(p)}
              className="rounded-lg border border-line px-3 py-2 text-left transition hover:border-circuit hover:bg-circuit-tint"
            >
              <p className="font-display text-[13px] font-semibold text-ink">{p.name}</p>
              <p className="font-mono text-[11px] text-subink">₹{p.price.toLocaleString("en-IN")}</p>
            </button>
          ))}
          {options.length === 0 && <p className="font-mono text-[11px] text-subink">Loading options…</p>}
        </div>
      )}
    </div>
  );
}
