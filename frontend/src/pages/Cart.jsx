import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cartApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

export default function Cart() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    cartApi.list().then(setItems).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-subink">Log in to view your cart.</p>
        <button onClick={() => navigate("/login")} className="mt-6 rounded-full bg-ink px-6 py-3 text-sm text-white hover:bg-circuit">
          Log in
        </button>
      </div>
    );
  }

  async function removeItem(id) {
    await cartApi.remove(id);
    setItems((its) => its.filter((i) => i.id !== id));
  }

  async function checkout() {
    setCheckingOut(true);
    setError(null);
    try {
      await cartApi.checkout();
      navigate("/orders");
    } catch (e) {
      setError(e?.response?.data?.detail || "Checkout failed.");
    } finally {
      setCheckingOut(false);
    }
  }

  const total = items.reduce((s, i) => s + i.line_total, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Cart</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Your cart</h1>

      {loading ? (
        <p className="mt-10 text-subink">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-subink">Your cart is empty.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-line bg-white p-5">
              <div>
                <p className="font-display text-[15px] font-semibold text-ink">{i.product.name}</p>
                <p className="mt-1 font-mono text-xs text-subink">
                  Qty {i.quantity} · {i.product.vendor_name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-ink">₹{i.line_total.toLocaleString("en-IN")}</span>
                <button onClick={() => removeItem(i.id)} className="font-mono text-xs text-subink hover:text-signal-stop">
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border border-line bg-circuit-tint/50 p-5">
            <span className="font-mono text-sm text-subink">Total</span>
            <span className="font-mono text-lg text-ink">₹{total.toLocaleString("en-IN")}</span>
          </div>

          {error && <p className="rounded-lg bg-signal-stop/10 px-4 py-2.5 text-sm text-signal-stop">{error}</p>}

          <button
            onClick={checkout}
            disabled={checkingOut}
            className="w-full rounded-full bg-ink py-3.5 text-sm font-medium text-white transition hover:bg-circuit disabled:opacity-60"
          >
            {checkingOut ? "Placing order…" : "Checkout"}
          </button>
        </div>
      )}
    </div>
  );
}
