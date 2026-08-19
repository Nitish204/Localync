import { useEffect, useState } from "react";
import { technicianApi } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

const statuses = ["pending", "accepted", "in_progress", "completed", "cancelled"];
const statusColor = {
  pending: "text-signal-warn bg-signal-warn/10",
  accepted: "text-circuit bg-circuit-tint",
  in_progress: "text-circuit bg-circuit-tint",
  completed: "text-signal-go bg-signal-go/10",
  cancelled: "text-signal-stop bg-signal-stop/10",
};

export default function TechnicianDashboard() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [available, setAvailable] = useState(true);

  function refresh() {
    technicianApi.requests().then(setRequests);
  }

  useEffect(() => {
    if (user && user.role === "technician") refresh();
  }, [user]);

  if (!user || user.role !== "technician") {
    return <div className="mx-auto max-w-lg px-6 py-24 text-center text-subink">This page is for technician accounts.</div>;
  }

  async function updateStatus(id, status) {
    await technicianApi.updateRequest(id, status);
    refresh();
  }

  async function toggleAvailability() {
    const next = !available;
    await technicianApi.setAvailability(next);
    setAvailable(next);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-circuit">Localync Technician</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">Service requests</h1>
        </div>
        <button
          onClick={toggleAvailability}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
            available ? "border-signal-go text-signal-go" : "border-line text-subink"
          }`}
        >
          <span className={`status-dot ${available ? "bg-signal-go" : "bg-line"}`} />
          {available ? "Available" : "Unavailable"}
        </button>
      </div>

      <div className="mt-10 space-y-4">
        {requests.length === 0 && <p className="text-sm text-subink">No requests right now.</p>}
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-semibold text-ink">{r.product_name}</p>
              <span className={`rounded-full px-3 py-1 font-mono text-[11px] capitalize ${statusColor[r.status]}`}>
                {r.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-subink">{r.issue}</p>
            <p className="mt-1 font-mono text-[11px] text-subink">
              {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(r.id, s)}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] capitalize transition ${
                    r.status === s ? "border-ink bg-ink text-white" : "border-line text-subink hover:border-ink/40"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
