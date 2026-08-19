import { useEffect, useState } from "react";
import { vendorApi, productApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: "", brand: "", category_slug: "", price: "", stock: 10, summary: "" });
  const [adding, setAdding] = useState(false);

  function refresh() {
    vendorApi.dashboard().then(setStats);
    vendorApi.products().then(setProducts);
    vendorApi.orders().then(setOrders);
  }

  useEffect(() => {
    if (!user || user.role !== "vendor") return;
    refresh();
    productApi.categories().then(setCategories);
  }, [user]);

  if (!user || user.role !== "vendor") {
    return <div className="mx-auto max-w-lg px-6 py-24 text-center text-subink">This page is for vendor accounts.</div>;
  }

  async function updateStockPrice(id, field, value) {
    await vendorApi.updateProduct(id, { [field]: value });
    refresh();
  }

  async function addProduct(e) {
    e.preventDefault();
    setAdding(true);
    try {
      await vendorApi.addProduct({
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
      });
      setNewProduct({ name: "", brand: "", category_slug: "", price: "", stock: 10, summary: "" });
      refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Localync Vendor</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Dashboard</h1>

      {stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Today's Orders" value={stats.today_orders} />
          <StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} />
          <StatCard label="Products" value={stats.products} />
          <StatCard label="Nearby Customers" value={stats.nearby_customers} />
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Quick Stock Update</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper">
                  <th className="p-3 text-left font-mono text-[11px] uppercase text-subink">Product</th>
                  <th className="p-3 text-left font-mono text-[11px] uppercase text-subink">Stock</th>
                  <th className="p-3 text-left font-mono text-[11px] uppercase text-subink">Price</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="p-3 text-[13px] text-ink">{p.name}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        defaultValue={p.stock}
                        onBlur={(e) => updateStockPrice(p.id, "stock", Number(e.target.value))}
                        className="w-20 rounded border border-line px-2 py-1 font-mono text-xs outline-none focus:border-circuit"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        defaultValue={p.price}
                        onBlur={(e) => updateStockPrice(p.id, "price", Number(e.target.value))}
                        className="w-24 rounded border border-line px-2 py-1 font-mono text-xs outline-none focus:border-circuit"
                      />
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={3} className="p-4 text-center text-sm text-subink">No products listed yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <form onSubmit={addProduct} className="mt-6 space-y-3 rounded-xl border border-line bg-white p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Add a product</p>
            <input required placeholder="Name" value={newProduct.name}
              onChange={(e) => setNewProduct((n) => ({ ...n, name: e.target.value }))}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Brand" value={newProduct.brand}
                onChange={(e) => setNewProduct((n) => ({ ...n, brand: e.target.value }))}
                className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit" />
              <select required value={newProduct.category_slug}
                onChange={(e) => setNewProduct((n) => ({ ...n, category_slug: e.target.value }))}
                className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit">
                <option value="">Category…</option>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" placeholder="Price ₹" value={newProduct.price}
                onChange={(e) => setNewProduct((n) => ({ ...n, price: e.target.value }))}
                className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit" />
              <input type="number" placeholder="Stock" value={newProduct.stock}
                onChange={(e) => setNewProduct((n) => ({ ...n, stock: e.target.value }))}
                className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit" />
            </div>
            <textarea placeholder="Short description" value={newProduct.summary}
              onChange={(e) => setNewProduct((n) => ({ ...n, summary: e.target.value }))}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-circuit" rows={2} />
            <button disabled={adding} className="w-full rounded-full bg-ink py-2.5 text-sm font-medium text-white hover:bg-circuit disabled:opacity-60">
              {adding ? "Adding…" : "Add product"}
            </button>
          </form>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Recent Orders</p>
          <div className="mt-4 space-y-3">
            {orders.length === 0 && <p className="text-sm text-subink">No orders yet.</p>}
            {orders.map((o, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-white p-4">
                <div>
                  <p className="font-display text-[14px] font-semibold text-ink">{o.product_name}</p>
                  <p className="font-mono text-[11px] text-subink">
                    Order #{o.order_id} · Qty {o.quantity} · {new Date(o.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="font-mono text-sm text-ink">
                  ₹{(o.price_at_purchase * o.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-subink">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
