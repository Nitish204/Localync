import { useEffect, useState } from "react";
import { cartApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

const statusColor = {
  placed: "text-signal-warn bg-signal-warn/10",
  confirmed: "text-circuit bg-circuit-tint",
  delivered: "text-signal-go bg-signal-go/10",
  cancelled: "text-signal-stop bg-signal-stop/10",
};

export default function Orders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    cartApi.orders().then(setOrders).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return <div className="mx-auto max-w-lg px-6 py-24 text-center text-subink">Log in to view your orders.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Orders</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Your order history</h1>

      {loading ? (
        <p className="mt-10 text-subink">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="mt-10 text-subink">No orders yet — your marketplace and PC builder purchases will show up here.</p>
      ) : (
        <div className="mt-10 space-y-5">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-subink">
                  Order #{o.id} · {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <span className={`rounded-full px-3 py-1 font-mono text-[11px] capitalize ${statusColor[o.status] || ""}`}>
                  {o.status}
                </span>
              </div>
              <div className="mt-3 divide-y divide-line">
                {o.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-2 text-sm">
                    <span className="text-ink">{it.product_name} × {it.quantity}</span>
                    <span className="font-mono text-subink">₹{(it.price_at_purchase * it.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-line pt-3 font-mono text-sm">
                <span className="text-subink">Total</span>
                <span className="text-ink">₹{o.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
