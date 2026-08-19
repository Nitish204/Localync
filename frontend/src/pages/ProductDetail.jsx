import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi, cartApi, repairApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";
import IntelligencePanel from "../components/IntelligencePanel";
import PriceChart from "../components/PriceChart";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [upgrades, setUpgrades] = useState([]);
  const [cartMsg, setCartMsg] = useState(null);

  useEffect(() => {
    productApi.get(id).then(setProduct);
    repairApi.upgrades(id).then(setUpgrades).catch(() => setUpgrades([]));
  }, [id]);

  if (!product) {
    return <div className="mx-auto max-w-5xl px-6 py-24 text-center text-subink">Loading…</div>;
  }

  async function addToCart() {
    if (!user) { navigate("/login"); return; }
    await cartApi.add(product.id, 1);
    setCartMsg("Added to cart.");
    setTimeout(() => setCartMsg(null), 2000);
  }

  const isGrocery = product.category_group === "grocery";

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <Link to={isGrocery ? "/local" : "/marketplace"} className="font-mono text-xs text-subink hover:text-ink">
        ← Back
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <div className="flex h-64 items-center justify-center rounded-xl bg-circuit-tint/50 font-display text-circuit">
            {product.category?.toUpperCase()}
          </div>

          <p className="mt-6 font-mono text-xs uppercase tracking-wide text-subink">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{product.name}</h1>
          <p className="mt-3 font-mono text-2xl text-ink">
            ₹{product.price.toLocaleString("en-IN")}{product.unit ? ` / ${product.unit}` : ""}
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-3">
            <span className={`status-dot ${product.stock > 5 ? "bg-signal-go" : "bg-signal-warn"}`} />
            <p className="font-mono text-[12px] text-subink">
              {product.stock} in stock · {product.vendor_name}
              {product.vendor_distance_km > 0 ? ` · ${product.vendor_distance_km} km away` : " · Online"}
            </p>
          </div>

          <button
            onClick={addToCart}
            className="mt-6 w-full rounded-full bg-ink py-3.5 text-sm font-medium text-white transition hover:bg-circuit"
          >
            {cartMsg || "Add to cart"}
          </button>

          {!isGrocery && (
            <Link
              to={`/repair?product=${product.id}`}
              className="mt-3 block w-full rounded-full border border-line py-3.5 text-center text-sm font-medium text-ink transition hover:border-circuit hover:text-circuit"
            >
              Repair or upgrade this
            </Link>
          )}

          <SpecTable product={product} />

          {upgrades.length > 0 && (
            <div className="mt-6 rounded-xl border border-line bg-white p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Upgrade possibilities</p>
              <div className="mt-3 space-y-3">
                {upgrades.map((u) => (
                  <div key={u.product_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] text-ink">{u.name}</p>
                      <p className="text-[11px] text-subink">{u.reason}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[11px] text-circuit">{"★".repeat(u.stars)}{"☆".repeat(5 - u.stars)}</span>
                      <span className="font-mono text-[11px] text-subink">₹{u.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <IntelligencePanel product={product} />
          <PriceChart history={product.price_history} currentPrice={product.price} />
        </div>
      </div>
    </div>
  );
}

function SpecTable({ product }) {
  const rows = [
    ["Socket", product.socket],
    ["RAM type", product.ram_type],
    ["RAM capacity", product.ram_capacity_gb ? `${product.ram_capacity_gb} GB` : null],
    ["Storage capacity", product.storage_capacity_gb ? `${product.storage_capacity_gb} GB` : null],
    ["Form factor", product.form_factor],
    ["Power draw", product.wattage_draw ? `${product.wattage_draw} W` : null],
    ["Power supply", product.wattage_supply ? `${product.wattage_supply} W` : null],
  ].filter(([, v]) => v);

  if (rows.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-line bg-white p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Technical spec</p>
      <div className="mt-3 divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 font-mono text-[12px]">
            <span className="text-subink">{label}</span>
            <span className="text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
