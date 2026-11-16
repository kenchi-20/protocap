"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { channelComparison } from "@/lib/seed";

const DELIVERY = "#7A1C1C";
const READ = "#1D4E89";

export function ChannelChart() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">Channel comparison</h3>
          <p className="text-xs text-slate-500">Delivery success and read-response, percent</p>
        </div>
        <div className="flex gap-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: DELIVERY }} />
            Delivery
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: READ }} />
            Read response
          </span>
        </div>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={channelComparison} barGap={2} barCategoryGap="28%" margin={{ top: 16, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="channel" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(122,28,28,0.04)" }}
              contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0", fontSize: 12 }}
              formatter={(value) => [`${value}%`, undefined]}
            />
            <Bar dataKey="delivery" name="Delivery" fill={DELIVERY} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="readResponse" name="Read response" fill={READ} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-2 w-full text-left text-xs text-slate-600">
        <caption className="sr-only">Delivery and read-response rates by channel</caption>
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-400">
            <th className="py-1 font-medium">Channel</th>
            <th className="py-1 font-medium">Delivery</th>
            <th className="py-1 font-medium">Read response</th>
          </tr>
        </thead>
        <tbody>
          {channelComparison.map((row) => (
            <tr key={row.channel} className="border-t border-slate-100">
              <td className="py-1.5 font-medium text-ink">{row.channel}</td>
              <td className="tabular">{row.delivery}%</td>
              <td className="tabular">{row.readResponse}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
