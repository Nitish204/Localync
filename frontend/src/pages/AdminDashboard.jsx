import { useEffect, useState } from "react";
import { adminApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

const tabs = ["Overview", "Users", "Vendors", "Products", "Orders"];

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  function refresh() {
    adminApi.dashboard().then(setStats);
    adminApi.users().then(setUsers);
    adminApi.vendors().then(setVendors);
    adminApi.products().then(setProducts);
    adminApi.orders().then(setOrders);
  }

  useEffect(() => {
    if (user && user.role === "admin") refresh();
  }, [user]);

  if (!user || user.role !== "admin") {
    return <div className="mx-auto max-w-lg px-6 py-24 text-center text-subink">This page is for admin accounts.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Localync Admin</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Platform control</h1>

      <div className="mt-8 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              tab === t ? "border-ink bg-ink text-white" : "border-line bg-white text-subink hover:border-ink/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatCard label="Users" value={stats.total_users} />
          <StatCard label="Vendors" value={stats.total_vendors} />
          <StatCard label="Products" value={stats.total_products} />
          <StatCard label="Orders" value={stats.total_orders} />
          <StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} />
        </div>
      )}

      {tab === "Users" && (
        <SimpleTable
          rows={users}
          columns={[
            ["Name", (u) => u.name],
            ["Email", (u) => u.email],
            ["Role", (u) => <span className="capitalize">{u.role}</span>],
            ["Status", (u) => (u.is_active ? "Active" : "Deactivated")],
          ]}
          action={(u) => (
            <button
              onClick={() => adminApi.toggleUser(u.id).then(refresh)}
              className="font-mono text-[11px] text-circuit hover:underline"
            >
              {u.is_active ? "Deactivate" : "Reactivate"}
            </button>
          )}
        />
      )}

      {tab === "Vendors" && (
        <SimpleTable
          rows={vendors}
          columns={[
            ["Name", (v) => v.name],
            ["Locality", (v) => v.locality],
            ["Products", (v) => v.product_count],
            ["Rating", (v) => `★${v.rating}`],
            ["Status", (v) => (v.is_active ? "Active" : "Deactivated")],
          ]}
          action={(v) => (
            <button
              onClick={() => adminApi.toggleVendor(v.id).then(refresh)}
              className="font-mono text-[11px] text-circuit hover:underline"
            >
              {v.is_active ? "Deactivate" : "Reactivate"}
            </button>
          )}
        />
      )}

      {tab === "Products" && (
        <SimpleTable
          rows={products}
          columns={[
            ["Name", (p) => p.name],
            ["Category", (p) => p.category],
            ["Vendor", (p) => p.vendor_name],
            ["Price", (p) => `₹${p.price.toLocaleString("en-IN")}`],
            ["Status", (p) => (p.is_active ? "Active" : "Hidden")],
          ]}
          action={(p) => (
            <button
              onClick={() => adminApi.toggleProduct(p.id).then(refresh)}
              className="font-mono text-[11px] text-circuit hover:underline"
            >
              {p.is_active ? "Hide" : "Unhide"}
            </button>
          )}
        />
      )}

      {tab === "Orders" && (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex justify-between">
                <p className="font-mono text-xs text-subink">
                  Order #{o.id} · {new Date(o.created_at).toLocaleDateString("en-IN")}
                </p>
                <span className="font-mono text-xs capitalize text-ink">{o.status}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-ink">₹{o.total.toLocaleString("en-IN")}</p>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-subink">No orders yet.</p>}
        </div>
      )}
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

function SimpleTable({ rows, columns, action }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-paper">
            {columns.map(([label]) => (
              <th key={label} className="p-3 text-left font-mono text-[11px] uppercase text-subink">{label}</th>
            ))}
            {action && <th className="p-3"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {columns.map(([label, fn]) => (
                <td key={label} className="p-3 text-[13px] text-ink">{fn(r)}</td>
              ))}
              {action && <td className="p-3">{action(r)}</td>}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="p-4 text-center text-sm text-subink">Nothing here yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
