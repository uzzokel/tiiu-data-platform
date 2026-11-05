"use client";
import React, { useEffect, useState } from "react";
import { fetchSubmissions, deleteOdkSubmission } from "@/services/tiiuApi";

export default function SubmissionsInspector() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  useEffect(() => {
    loadSubs();
  }, []);

  const loadSubs = async () => {
    try {
      const data = await fetchSubmissions();
      setSubmissions(data.submissions || []);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete submission?")) return;
    try {
      await deleteOdkSubmission(id);
      loadSubs();
      if (selectedSub?.id === id) setSelectedSub(null);
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm lg:col-span-2 space-y-4">
        <h3 className="text-sm font-black uppercase text-slate-900">🔍 ODK Audit Submissions Feed</h3>
        <div className="overflow-x-auto max-h-[450px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 text-slate-500 uppercase">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Form ID</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedSub(sub)}>
                  <td className="p-3">{sub.id}</td>
                  <td className="p-3 font-bold text-emerald-800">{sub.form_id}</td>
                  <td className="p-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }} className="text-red-600 bg-red-50 px-2.5 py-1 rounded text-[10px]">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-[450px]">
        <h3 className="text-sm font-black uppercase text-slate-900 mb-2">Record Inspector</h3>
        {selectedSub ? (
          <div className="flex-1 bg-slate-900 text-emerald-400 p-3 rounded-2xl overflow-auto text-xs font-mono">
            <pre>{JSON.stringify(selectedSub.data, null, 2)}</pre>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed rounded-2xl">
            Select an audit row to inspect details.
          </div>
        )}
      </div>
    </div>
  );
}