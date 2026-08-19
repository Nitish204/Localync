import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { repairApi, productApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

const statusColor = {
  pending: "text-signal-warn bg-signal-warn/10",
  accepted: "text-circuit bg-circuit-tint",
  in_progress: "text-circuit bg-circuit-tint",
  completed: "text-signal-go bg-signal-go/10",
  cancelled: "text-signal-stop bg-signal-stop/10",
};

export default function RepairCenter() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [technicians, setTechnicians] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [productName, setProductName] = useState("");
  const [issue, setIssue] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    repairApi.technicians().then(setTechnicians);
    const productId = searchParams.get("product");
    if (productId) productApi.get(productId).then((p) => setProductName(p.name));
  }, [searchParams]);

  useEffect(() => {
    if (user) repairApi.myRequests().then(setMyRequests);
  }, [user]);

  async function submitRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await repairApi.createRequest({
        product_name: productName,
        issue,
        technician_id: technicianId ? Number(technicianId) : null,
      });
      setMsg("Request sent — a technician will follow up.");
      setIssue("");
      if (user) repairApi.myRequests().then(setMyRequests);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Repair & Upgrade Center</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
        Extend its life, don't replace it
      </h1>
      <p className="mt-2 max-w-lg text-sm text-subink">
        Every product page shows real upgrade paths. When it's beyond upgrading, find a technician near you here.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Technicians near you</p>
          <div className="mt-4 space-y-3">
            {technicians.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  String(technicianId) === String(t.id) ? "border-circuit bg-circuit-tint" : "border-line bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="tech"
                    checked={String(technicianId) === String(t.id)}
                    onChange={() => setTechnicianId(t.id)}
                  />
                  <div>
                    <p className="font-display text-[14px] font-semibold text-ink">{t.name}</p>
                    <p className="text-[12px] text-subink">{t.specialty}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-subink">{t.distance_km} km · ★{t.rating}</span>
              </label>
            ))}
          </div>

          <form onSubmit={submitRequest} className="mt-8 space-y-4 rounded-xl border border-line bg-white p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Request help</p>
            <input
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Product or device"
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-circuit"
            />
            <textarea
              required
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="What's wrong, or what do you want upgraded?"
              rows={3}
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm outline-none focus:border-circuit"
            />
            {msg && <p className="text-sm text-signal-go">{msg}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-ink py-3 text-sm font-medium text-white hover:bg-circuit disabled:opacity-60"
            >
              {submitting ? "Sending…" : user ? "Send request" : "Log in to send request"}
            </button>
          </form>
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Your requests</p>
          <div className="mt-4 space-y-3">
            {!user && <p className="text-sm text-subink">Log in to see your repair requests.</p>}
            {user && myRequests.length === 0 && <p className="text-sm text-subink">No requests yet.</p>}
            {myRequests.map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[14px] font-semibold text-ink">{r.product_name}</p>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[11px] capitalize ${statusColor[r.status]}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-subink">{r.issue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
