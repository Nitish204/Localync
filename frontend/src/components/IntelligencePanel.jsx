const dims = [
  ["score_performance", "Performance"],
  ["score_value", "Value"],
  ["score_upgradeability", "Upgradeability"],
  ["score_repairability", "Repairability"],
  ["score_longevity", "Longevity"],
];

export default function IntelligencePanel({ product }) {
  return (
    <div className="bracket-frame rounded-xl bg-panel p-6 shadow-soft">
      <span className="bracket-tr" />
      <span className="bracket-bl" />
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">
        Localync Intelligence
      </p>

      <div className="mt-5 space-y-4">
        {dims.map(([key, label]) => (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between font-mono text-[12px]">
              <span className="text-subink">{label}</span>
              <span className="text-ink">{product[key]}/100</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full ${barColor(product[key])}`}
                style={{ width: `${product[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-subink">Why this product?</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink">{product.summary}</p>
      </div>
    </div>
  );
}

function barColor(v) {
  if (v >= 80) return "bg-signal-go";
  if (v >= 60) return "bg-signal-warn";
  return "bg-signal-stop";
}
