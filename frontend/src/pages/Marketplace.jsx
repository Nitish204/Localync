import { useEffect, useState } from "react";
import { productApi } from "../lib/api";
import ProductCard from "../components/ProductCard";

export default function Marketplace({ group = "tech" }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(null);
    productApi.categories(group).then(setCategories);
  }, [group]);

  useEffect(() => {
    setLoading(true);
    productApi
      .list({ group, category: activeCategory || undefined, q: query || undefined })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [group, activeCategory, query]);

  const visible = nearbyOnly ? products.filter((p) => p.vendor_distance_km > 0) : products;
  const isGrocery = group === "grocery";

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">
            {isGrocery ? "Local Marketplace" : "Marketplace"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
            {isGrocery ? "Fresh, from vendors near you" : "Every product, scored"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-56 rounded-full border border-line bg-white px-4 py-2.5 text-sm outline-none focus:border-circuit"
          />
          <button
            onClick={() => setNearbyOnly((v) => !v)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition ${
              nearbyOnly ? "border-circuit bg-circuit-tint text-circuit" : "border-line bg-white text-subink"
            }`}
          >
            <span className={`status-dot ${nearbyOnly ? "bg-circuit" : "bg-line"}`} />
            Nearby
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Chip active={!activeCategory} onClick={() => setActiveCategory(null)}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip key={c.slug} active={activeCategory === c.slug} onClick={() => setActiveCategory(c.slug)}>
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border border-line bg-white" />
          ))
        ) : visible.length === 0 ? (
          <p className="col-span-full py-16 text-center text-subink">
            Nothing matches yet — try a different search or category.
          </p>
        ) : (
          visible.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active ? "border-ink bg-ink text-white" : "border-line bg-white text-subink hover:border-ink/40"
      }`}
    >
      {children}
    </button>
  );
}
