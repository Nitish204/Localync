import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-line bg-white transition hover:border-circuit hover:shadow-soft"
    >
      <div className="flex h-40 items-center justify-center bg-circuit-tint/50 font-display text-sm text-circuit">
        {product.category?.toUpperCase()}
      </div>
      <div className="p-5">
        <p className="font-mono text-[11px] uppercase tracking-wide text-subink">{product.brand}</p>
        <h3 className="mt-1 font-display text-[15px] font-semibold text-ink group-hover:text-circuit">
          {product.name}
        </h3>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-mono text-lg text-ink">
            ₹{product.price.toLocaleString("en-IN")}{product.unit ? `/${product.unit}` : ""}
          </span>
          <span className="font-mono text-[11px] text-subink">
            {product.vendor_distance_km === 0 ? "Online" : `${product.vendor_distance_km} km`}
          </span>
        </div>
        {product.category_group !== "grocery" && (
          <div className="mt-3 flex items-center gap-1.5">
            <ScoreBar value={product.score_performance} />
            <span className="font-mono text-[11px] text-subink">{product.score_performance}/100 perf</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ScoreBar({ value }) {
  const color = value >= 80 ? "bg-signal-go" : value >= 60 ? "bg-signal-warn" : "bg-signal-stop";
  return (
    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-line">
      <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}
