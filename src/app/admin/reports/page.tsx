"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/api";
import { formatPrice } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function AdminReports() {
  const [period, setPeriod] = useState("6months");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const months = period === '1year' ? 12 : period === 'alltime' ? 24 : 6;
        const [revenueRes, monthlyRes, venueTypeRes, topVenuesRes, financialRes] = await Promise.all([
          api.get(`/admin/reports/revenue?months=${months}`),
          api.get(`/admin/reports/monthly-bookings?months=${months}`),
          api.get("/admin/reports/venue-type-split"),
          api.get("/admin/reports/top-venues"),
          api.get(`/admin/reports/financial?period=${period}`)
        ]);

        setData({
          revenue: Array.isArray(revenueRes.data) ? revenueRes.data : [],
          monthly: Array.isArray(monthlyRes.data) ? monthlyRes.data : [],
          venueType: venueTypeRes.data || {},
          topVenues: Array.isArray(topVenuesRes.data) ? topVenuesRes.data : [],
          financial: financialRes.data || {}
        });
      } catch (error) {
        console.error("Failed to fetch reports", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [period]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!data) return <div>Failed to load data</div>;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {[["6months","6 Months"],["1year","1 Year"],["alltime","All Time"]].map(([v, l]) => (
          <button key={v} onClick={() => setPeriod(v)}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all",
              period === v ? "bg-[#16A34A] text-white shadow" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
            )}
          >{l}</button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Revenue",    value: formatPrice(data.financial?.grossRevenue ?? 0)  },
          { label: "Net Revenue",      value: formatPrice(data.financial?.netRevenue ?? 0)  },
          { label: "Avg Booking Value",value: formatPrice(data.financial?.avgBookingValue ?? 0)  },
          { label: "Cancellation Rate",value: `${(data.financial?.cancellationRate ?? 0).toFixed?.(1) ?? '0.0'}%` },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-gray-500 text-xs font-medium mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue vs Bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Revenue vs Bookings</h2>
          <p className="text-gray-400 text-xs mb-4">Monthly comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenue || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tickFormatter={v => `${v/1000000}M`} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="revenue" fill="#16A34A" radius={[6,6,0,0]} name="Revenue" />
              <Bar yAxisId="right" dataKey="bookings" fill="#FACC15" radius={[6,6,0,0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Venue type split */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-1">Venue Type Split</h2>
          <p className="text-gray-400 text-xs mb-4">Indoor vs Outdoor bookings</p>
          {(() => {
            const venueTypeData = Array.isArray(data.venueType) ? data.venueType : [
              { name: "Indoor", value: data.venueType?.indoor ?? 0, color: "#16A34A" },
              { name: "Outdoor", value: data.venueType?.outdoor ?? 0, color: "#FACC15" },
            ];
            return (
              <>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={venueTypeData} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name} ${value}`} labelLine={false}>
                        {venueTypeData.map((entry: any, i: number) => <Cell key={i} fill={entry.color || (i === 0 ? "#16A34A" : "#FACC15")} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "10px", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  {venueTypeData.map((d: any, i: number) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color || (i === 0 ? "#16A34A" : "#FACC15") }} />
                      <span className="text-gray-600">{d.name}</span>
                      <span className="font-bold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Top Venues Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Top Performing Venues</h2>
        </div>
        <div className="p-5 space-y-4">
          {(data.topVenues || []).map((v: any, i: number) => (
            <div key={v.name || i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{i + 1}</span>
                  <span className="font-semibold text-gray-800 text-sm">{v.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">{v.totalBookings ?? v.bookings ?? 0} bookings</span>
                  <span className="font-bold text-[#16A34A]">{formatPrice(v.revenue ?? 0)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full transition-all" style={{ width: `${v.percentage ?? v.pct ?? 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
