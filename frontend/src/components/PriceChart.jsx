import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceChart({ history, currentPrice }) {
  if (!history || history.length === 0) return null;

  const prices = history.map((h) => h.price);
  const lowest = Math.min(...prices);
  const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const goodTime = currentPrice <= average * 0.97;

  const data = history.map((h) => ({
    date: new Date(h.recorded_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    price: Math.round(h.price),
  }));

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-circuit">Price history</p>
        <span
          className={`rounded-full px-3 py-1 font-mono text-[11px] ${
            goodTime ? "bg-signal-go/10 text-signal-go" : "bg-signal-warn/10 text-signal-warn"
          }`}
        >
          {goodTime ? "Good time to buy" : "Wait for a better price"}
        </span>
      </div>

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B36D6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3B36D6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5B5C63" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: "#5B5C63" }}
              axisLine={false}
              tickLine={false}
              domain={["dataMin - 500", "dataMax + 500"]}
            />
            <Tooltip
              formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Price"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E2D6" }}
            />
            <Area type="monotone" dataKey="price" stroke="#3B36D6" strokeWidth={2} fill="url(#priceFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4 font-mono text-[12px]">
        <Stat label="Current" value={currentPrice} />
        <Stat label="Lowest" value={lowest} />
        <Stat label="Average" value={average} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-subink">{label}</p>
      <p className="mt-1 text-ink">₹{Math.round(value).toLocaleString("en-IN")}</p>
    </div>
  );
}
