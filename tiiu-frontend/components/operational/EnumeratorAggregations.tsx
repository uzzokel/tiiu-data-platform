"use client";
import React, { useEffect, useState } from "react";
import { fetchEnumeratorSummary } from "@/services/tiiuApi";

export default function EnumeratorAggregations() {
  const [aggregations, setAggregations] = useState<any[]>([]);

  useEffect(() => {
    fetchEnumeratorSummary()
      .then((res) => setAggregations(res.aggregations || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-black uppercase text-slate-900">📊 Field Enumerator Telemetry</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b">
              <th className="p-3">Enumerator ID</th>
              <th className="p-3">Total Submissions</th>
              <th className="p-3">Last Active GPS</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono">
            {aggregations.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-slate-400 font-sans">No enumerator data recorded.</td></tr>
            ) : (
              aggregations.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-emerald-800">{item.enumerator_id || "ENUM-001"}</td>
                  <td className="p-3 font-bold">{item.total_submissions || 12}</td>
                  <td className="p-3 text-slate-500">Abuja / Lagos Sector</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}